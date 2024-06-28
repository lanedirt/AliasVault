//-----------------------------------------------------------------------
// <copyright file="AliasClientDbContext.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasClientDb;

using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

/// <summary>
/// The AliasClientDbContext class.
/// </summary>
public class AliasClientDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AliasClientDbContext"/> class.
    /// </summary>
    public AliasClientDbContext()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasClientDbContext"/> class.
    /// </summary>
    /// <param name="sqliteConnection">The SQLite connection to use to connect to the SQLite database.</param>
    public AliasClientDbContext(SqliteConnection sqliteConnection)
        : this(new DbContextOptionsBuilder<AliasClientDbContext>()
            .UseSqlite(sqliteConnection)
            .Options)
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasClientDbContext"/> class.
    /// </summary>
    /// <param name="options">DbContextOptions to use.</param>
    public AliasClientDbContext(DbContextOptions<AliasClientDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the Passwords DbSet.
    /// </summary>
    public DbSet<Password> Passwords { get; set; }

    /// <inheritdoc />
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Insert your custom logic here (before saving changes)
        Console.WriteLine("Before SaveChangesAsync");

        // Call the base method to save changes to the database
        int result = await base.SaveChangesAsync(cancellationToken);

        // Insert your custom logic here (after saving changes)
        Console.WriteLine("After SaveChangesAsync");

        return result;
    }

    /// <summary>
    /// The OnModelCreating method.
    /// </summary>
    /// <param name="modelBuilder">ModelBuilder instance.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
        // If the options are not already configured, use the appsettings.json file.
        if (!optionsBuilder.IsConfigured)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            optionsBuilder
                .UseSqlite(configuration.GetConnectionString("AliasClientDbContext"))
                .UseLazyLoadingProxies();
        }
    }
}
