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
using Microsoft.Extensions.Logging;

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
    /// <param name="logAction">The action to perform for logging.</param>
    public AliasClientDbContext(SqliteConnection sqliteConnection, Action<string> logAction)
        : base(GetOptions(sqliteConnection, logAction))
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
    /// Gets or sets the Alias DbSet.
    /// </summary>
    public DbSet<Alias> Aliases { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Attachment DbSet.
    /// </summary>
    public DbSet<Attachment> Attachment { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Credential DbSet.
    /// </summary>
    public DbSet<Credential> Credentials { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Password DbSet.
    /// </summary>
    public DbSet<Password> Passwords { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Service DbSet.
    /// </summary>
    public DbSet<Service> Services { get; set; } = null!;

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

        // Configure Credential - Alias relationship
        modelBuilder.Entity<Credential>()
            .HasOne(l => l.Alias)
            .WithMany(c => c.Credentials)
            .HasForeignKey(l => l.AliasId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Credential - Service relationship
        modelBuilder.Entity<Credential>()
            .HasOne(l => l.Service)
            .WithMany(c => c.Credentials)
            .HasForeignKey(l => l.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Attachment - Credential relationship
        modelBuilder.Entity<Attachment>()
            .HasOne(l => l.Credential)
            .WithMany(c => c.Attachments)
            .HasForeignKey(l => l.CredentialId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Password - Credential relationship
        modelBuilder.Entity<Password>()
            .HasOne(l => l.Credential)
            .WithMany(c => c.Passwords)
            .HasForeignKey(l => l.CredentialId)
            .OnDelete(DeleteBehavior.Cascade);
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

            optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information);
        }

        base.OnConfiguring(optionsBuilder);
    }

    private static DbContextOptions<AliasClientDbContext> GetOptions(SqliteConnection connection, Action<string> logAction)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AliasClientDbContext>();
        optionsBuilder.UseSqlite(connection);

        optionsBuilder.LogTo(logAction, new[] { DbLoggerCategory.Database.Command.Name }, LogLevel.Information);

        return optionsBuilder.Options;
    }
}
