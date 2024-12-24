//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasServerDb;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

// Add return type for top-level statements
return await Program.Run(args);

/// <summary>
/// Handles the migration of data between SQLite and PostgreSQL databases and password hashing utilities.
/// </summary>
public partial class Program
{
    /// <summary>
    /// Runs the program with the given arguments.
    /// </summary>
    /// <param name="args">The command-line arguments.</param>
    /// <returns>The exit code of the program.</returns>
    public static async Task<int> Run(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage:");
            Console.WriteLine("  hash-password <password>");
            Console.WriteLine("  migrate-sqlite <path-to-sqlite-db>");
            return 1;
        }

        switch (args[0].ToLower())
        {
            case "hash-password":
                if (args.Length != 2)
                {
                    Console.WriteLine("Usage: hash-password <password>");
                    return 1;
                }

                return HashPassword(args[1]);

            case "migrate-sqlite":
                if (args.Length != 2)
                {
                    Console.WriteLine("Usage: migrate-sqlite <path-to-sqlite-db>");
                    return 1;
                }

                return await MigrateSqliteToPostgres(args[1]);

            default:
                Console.WriteLine("Unknown command. Available commands:");
                Console.WriteLine("  hash-password <password>");
                Console.WriteLine("  migrate-sqlite <path-to-sqlite-db>");
                return 1;
        }
    }

    /// <summary>
    /// Hashes a password using ASP.NET Core Identity's password hasher.
    /// </summary>
    /// <param name="password">The plain text password to hash.</param>
    /// <returns>
    /// Returns 0 if the password was successfully hashed and printed to console.
    /// </returns>
    private static int HashPassword(string password)
    {
        var hasher = new PasswordHasher<IdentityUser>();
        var user = new AdminUser();
        var hashedPassword = hasher.HashPassword(user, password);
        Console.WriteLine(hashedPassword);
        return 0;
    }

    /// <summary>
    /// Migrates data from a SQLite database to a PostgreSQL database.
    /// </summary>
    /// <param name="sqliteDbPath">The file path to the source SQLite database.</param>
    /// <returns>
    /// Returns 0 if migration was successful, 1 if an error occurred.
    /// </returns>
    /// <exception cref="Exception">Thrown when a migration error occurs.</exception>
    private static async Task<int> MigrateSqliteToPostgres(string sqliteDbPath)
    {
        try
        {
            if (!File.Exists(sqliteDbPath))
            {
                Console.WriteLine($"Error: SQLite database not found at {sqliteDbPath}");
                return 1;
            }

            Console.WriteLine($"Migrating SQLite database to PostgreSQL - start");

            // Create connections to both databases
            var sqliteConnString = $"Data Source={sqliteDbPath}";
            var pgConnString = "Host=localhost;Port=5433;Database=aliasvault;Username=aliasvault;Password=password";

            // Create contexts
            var optionsBuilderSqlite = new DbContextOptionsBuilder<AliasServerDbContext>()
                .UseSqlite(sqliteConnString);

            // Make sure sqlite is on latest version migration
            Console.WriteLine("Update sqlite database to latest version...");
            await using var sqliteContext = new AliasServerDbContextSqlite(optionsBuilderSqlite.Options);
            await sqliteContext.Database.MigrateAsync();
            Console.WriteLine("Updating finished.");

            var optionsBuilderPg = new DbContextOptionsBuilder<AliasServerDbContext>()
                .UseNpgsql(pgConnString);

            // Make sure postgres is on latest version migration
            Console.WriteLine("Update postgres database to latest version...");
            await using var pgContext = new AliasServerDbContextPostgresql(optionsBuilderPg.Options);
            await pgContext.Database.EnsureDeletedAsync();
            await pgContext.Database.MigrateAsync();
            Console.WriteLine("Updating finished.");

            Console.WriteLine("Starting content migration...");

            // First, migrate tables without foreign key dependencies
            await MigrateTable(sqliteContext.AliasVaultRoles, pgContext.AliasVaultRoles, pgContext, "AliasVaultRoles");
            await MigrateTable(sqliteContext.AliasVaultUsers, pgContext.AliasVaultUsers, pgContext, "AliasVaultUsers");
            await MigrateTable(sqliteContext.ServerSettings, pgContext.ServerSettings, pgContext, "ServerSettings");
            await MigrateTable(sqliteContext.DataProtectionKeys, pgContext.DataProtectionKeys, pgContext, "DataProtectionKeys");
            await MigrateTable(sqliteContext.AuthLogs, pgContext.AuthLogs, pgContext, "AuthLogs");
            await MigrateTable(sqliteContext.AdminUsers, pgContext.AdminUsers, pgContext, "AdminUsers");

            // Then migrate tables with foreign key dependencies
            await MigrateTable(sqliteContext.AliasVaultUserRefreshTokens, pgContext.AliasVaultUserRefreshTokens, pgContext, "AliasVaultUserRefreshTokens");
            await MigrateTable(sqliteContext.UserEncryptionKeys, pgContext.UserEncryptionKeys, pgContext, "UserEncryptionKeys");
            await MigrateTable(sqliteContext.UserEmailClaims, pgContext.UserEmailClaims, pgContext, "UserEmailClaims");
            await MigrateTable(sqliteContext.Vaults, pgContext.Vaults, pgContext, "Vaults");

            // Identity framework related tables
            await MigrateTable(sqliteContext.UserRoles, pgContext.UserRoles, pgContext, "UserRoles");
            await MigrateTable(sqliteContext.UserLogin, pgContext.UserLogin, pgContext, "UserLogins");
            await MigrateTable(sqliteContext.UserTokens, pgContext.UserTokens, pgContext, "UserTokens");

            // Email related tables (last due to dependencies)
            await MigrateTable(sqliteContext.Emails, pgContext.Emails, pgContext, "Emails");
            await MigrateTable(sqliteContext.EmailAttachments, pgContext.EmailAttachments, pgContext, "EmailAttachments");

            Console.WriteLine("Migration completed successfully!");
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during migration: {ex.Message}");
            Console.WriteLine(ex.InnerException);
            return 1;
        }
    }

    /// <summary>
    /// Migrates data from one database table to another, handling the transfer in batches.
    /// </summary>
    /// <typeparam name="T">The entity type of the table being migrated.</typeparam>
    /// <param name="source">The source database table.</param>
    /// <param name="destination">The destination database table.</param>
    /// <param name="destinationContext">The destination database context.</param>
    /// <param name="tableName">The name of the table being migrated (for logging purposes).</param>
    /// <returns>A task representing the asynchronous migration operation.</returns>
    /// <exception cref="ArgumentException">
    /// Thrown when the number of records in source and destination tables don't match after migration.
    /// </exception>
    /// <exception cref="DbUpdateConcurrencyException">
    /// Thrown when a concurrency conflict occurs during the migration.
    /// </exception>
    private static async Task MigrateTable<T>(
        DbSet<T> source,
        DbSet<T> destination,
        DbContext destinationContext,
        string tableName)
        where T : class
    {
        Console.WriteLine($"Migrating {tableName}...");

        var items = await source.ToListAsync();
        Console.WriteLine($"Found {items.Count} records to migrate");

        if (items.Count > 0)
        {
            const int batchSize = 30;
            foreach (var batch in items.Chunk(batchSize))
            {
                try
                {
                    await destination.AddRangeAsync(batch);
                    await destinationContext.SaveChangesAsync();
                    Console.WriteLine($"Migrated {batch.Length} records from {tableName}");
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    // Handle concurrency conflict
                    foreach (var entry in ex.Entries)
                    {
                        // Get current values from database
                        var databaseValues = await entry.GetDatabaseValuesAsync();

                        if (databaseValues == null)
                        {
                            // Row was deleted
                            entry.State = EntityState.Detached;
                        }
                        else
                        {
                            // Update the original values with the database values
                            entry.OriginalValues.SetValues(databaseValues);

                            // Retry the save operation
                            await destinationContext.SaveChangesAsync();
                        }
                    }
                }
            }
        }

        // Ensure that the amount of records in the source and destination tables match
        if (await source.CountAsync() != await destination.CountAsync())
        {
            throw new ArgumentException($"The amount of records in the source and destination tables do not match. Check if the migration is working correctly.");
        }
    }
}
