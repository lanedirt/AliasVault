//-----------------------------------------------------------------------
// <copyright file="AliasServerDbContextSqlite.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

/// <summary>
/// SQLite implementation of the AliasServerDbContext.
/// </summary>
public class AliasServerDbContextSqlite : AliasServerDbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AliasServerDbContextSqlite"/> class.
    /// </summary>
    public AliasServerDbContextSqlite()
    {
        SetPragmaSettings();
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasServerDbContextSqlite"/> class.
    /// </summary>
    /// <param name="options">DbContextOptions.</param>
    public AliasServerDbContextSqlite(DbContextOptions<AliasServerDbContext> options)
        : base(options)
    {
        SetPragmaSettings();
    }

    /// <summary>
    /// The OnModelCreating method.
    /// </summary>
    /// <param name="modelBuilder">ModelBuilder instance.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Set TEXT as default column type for string properties because
        // SQLite does not support varchar(max).
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                // SQLite does not support varchar(max) so we use TEXT.
                if (property.ClrType == typeof(string) && property.GetMaxLength() == null)
                {
                    property.SetColumnType("TEXT");
                }
            }
        }
    }

    /// <summary>
    /// Sets up the connection string if it is not already configured.
    /// </summary>
    /// <param name="optionsBuilder">DbContextOptionsBuilder instance.</param>
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (optionsBuilder.IsConfigured)
        {
            return;
        }

        var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

        // Add SQLite connection with enhanced settings
        var connectionString = configuration.GetConnectionString("AliasServerDbContext") +
                               ";Mode=ReadWriteCreate;Cache=Shared";

        optionsBuilder
            .UseSqlite(connectionString, options => options.CommandTimeout(60))
            .UseLazyLoadingProxies();
    }

    /// <summary>
    /// Sets up the PRAGMA settings for SQLite.
    /// </summary>
    private void SetPragmaSettings()
    {
        var connection = Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
        }

        using (var command = connection.CreateCommand())
        {
            // Increase busy timeout
            command.CommandText = @"
                    PRAGMA busy_timeout = 30000;
                    PRAGMA journal_mode = WAL;
                    PRAGMA synchronous = NORMAL;
                    PRAGMA temp_store = MEMORY;
                    PRAGMA mmap_size = 1073741824;";
            command.ExecuteNonQuery();
        }
    }
}
