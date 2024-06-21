//-----------------------------------------------------------------------
// <copyright file="AliasDbContext.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasDb;

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

/// <summary>
/// The AliasDbContext class.
/// </summary>
public class AliasDbContext : IdentityDbContext<AliasVaultUser>
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AliasDbContext"/> class.
    /// </summary>
    public AliasDbContext()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasDbContext"/> class.
    /// </summary>
    /// <param name="options">DbContextOptions.</param>
    public AliasDbContext(DbContextOptions<AliasDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the Identities DbSet.
    /// </summary>
    public DbSet<Identity> Identities { get; set; }

    /// <summary>
    /// Gets or sets the Logins DbSet.
    /// </summary>
    public DbSet<Login> Logins { get; set; }

    /// <summary>
    /// Gets or sets the Passwords DbSet.
    /// </summary>
    public DbSet<Password> Passwords { get; set; }

    /// <summary>
    /// Gets or sets the Services DbSet.
    /// </summary>
    public DbSet<Service> Services { get; set; }

    /// <summary>
    /// Gets or sets the AspNetUserRefreshTokens DbSet.
    /// </summary>
    public DbSet<AspNetUserRefreshToken> AspNetUserRefreshTokens { get; set; }

    /// <summary>
    /// Gets or sets the AliasVaultUser DbSet.
    /// </summary>
    public DbSet<AliasVaultUser> AliasVaultUsers { get; set; }

    /// <summary>
    /// The OnModelCreating method.
    /// </summary>
    /// <param name="builder">ModelBuilder instance.</param>
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        foreach (var entity in builder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                // NOTE: This is a workaround for SQLite. Add conditional check if SQLite is used.
                // NOTE: SQL server doesn't need this override.

                // SQLite does not support varchar(max) so we use TEXT.
                if (property.ClrType == typeof(string) && property.GetMaxLength() == null)
                {
                    property.SetColumnType("TEXT");
                }
            }
        }

        // Configure Identity - Login relationship
        builder.Entity<Login>()
            .HasOne(l => l.Identity)
            .WithMany()
            .HasForeignKey(l => l.IdentityId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure the Login - UserId entity
        builder.Entity<Login>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .IsRequired();

        // Configure Login - Service relationship
        builder.Entity<Login>()
            .HasOne(l => l.Service)
            .WithMany()
            .HasForeignKey(l => l.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Login - Password relationship
        builder.Entity<Login>()
            .HasMany(l => l.Passwords)
            .WithOne(p => p.Login)
            .HasForeignKey(p => p.LoginId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Identity - DefaultPassword relationship
        builder.Entity<Identity>()
            .HasOne(i => i.DefaultPassword)
            .WithMany()
            .HasForeignKey(i => i.DefaultPasswordId)
            .OnDelete(DeleteBehavior.SetNull);

        // Configure the User - AspNetUserRefreshToken entity
        builder.Entity<AspNetUserRefreshToken>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .IsRequired();
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
                .UseSqlite(configuration.GetConnectionString("AliasDbContext"))
                .UseLazyLoadingProxies();
        }
    }
}
