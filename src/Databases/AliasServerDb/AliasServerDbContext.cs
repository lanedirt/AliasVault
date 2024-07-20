//-----------------------------------------------------------------------
// <copyright file="AliasServerDbContext.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

/// <summary>
/// The AliasServerDbContext class. Note: we  are using DbContext instead of IdentityDbContext because
/// we have two separate user objects, one for the admin panel and one for the vault. We manually
/// define the Identity tables in the OnModelCreating method.
/// </summary>
public class AliasServerDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AliasServerDbContext"/> class.
    /// </summary>
    public AliasServerDbContext()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasServerDbContext"/> class.
    /// </summary>
    /// <param name="options">DbContextOptions.</param>
    public AliasServerDbContext(DbContextOptions<AliasServerDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the AliasVaultUser DbSet.
    /// </summary>
    public DbSet<AliasVaultUser> AliasVaultUsers { get; set; }

    /// <summary>
    /// Gets or sets the AliasVaultRoles DbSet.
    /// </summary>
    public DbSet<AliasVaultRole> AliasVaultRoles { get; set; }

    /// <summary>
    /// Gets or sets the UserRoles DbSet.
    /// </summary>
    public DbSet<IdentityUserRole<string>> UserRoles { get; set; }

    /// <summary>
    /// Gets or sets the UserClaims DbSet.
    /// </summary>
    public DbSet<IdentityUserClaim<string>> UserClaims { get; set; }

    /// <summary>
    /// Gets or sets the UserLogin DbSet.
    /// </summary>
    public DbSet<IdentityUserLogin<string>> UserLogin { get; set; }

    /// <summary>
    /// Gets or sets the RoleClaims DbSet.
    /// </summary>
    public DbSet<IdentityRoleClaim<string>> RoleClaims { get; set; }

    /// <summary>
    /// Gets or sets the UserTokens DbSet.
    /// </summary>
    public DbSet<IdentityUserToken<string>> UserTokens { get; set; }

    /// <summary>
    /// Gets or sets the UserRefreshTokens DbSet.
    /// </summary>
    public DbSet<AliasVaultUserRefreshToken> AliasVaultUserRefreshTokens { get; set; }

    /// <summary>
    /// Gets or sets the AdminUser DbSet.
    /// </summary>
    public DbSet<AdminUser> AdminUsers { get; set; }

    /// <summary>
    /// Gets or sets the AdminRoles DbSet.
    /// </summary>
    public DbSet<AdminRole> AdminRoles { get; set; }

    /// <summary>
    /// Gets or sets the Vaults DbSet.
    /// </summary>
    public DbSet<Vault> Vaults { get; set; }

    /// <summary>
    /// Gets or sets the Emails DbSet.
    /// </summary>
    public DbSet<Email> Emails { get; set; }

    /// <summary>
    /// Gets or sets the EmailAttachments DbSet.
    /// </summary>
    public DbSet<EmailAttachment> EmailAttachments { get; set; }

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

        // Configure AspNetIdentity tables manually.
        builder.Entity<IdentityUserRole<string>>(entity =>
        {
            entity.HasKey(r => new { r.UserId, r.RoleId });
            entity.ToTable("UserRoles");
        });

        builder.Entity<IdentityUserClaim<string>>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.ToTable("UserClaims");
        });

        builder.Entity<IdentityUserLogin<string>>(entity =>
        {
            entity.HasKey(l => new { l.LoginProvider, l.ProviderKey });
            entity.ToTable("UserLogins");
        });

        builder.Entity<IdentityRoleClaim<string>>(entity =>
        {
            entity.HasKey(rc => rc.Id);
            entity.ToTable("RoleClaims");
        });

        builder.Entity<IdentityUserToken<string>>(entity =>
        {
            entity.HasKey(t => new { t.UserId, t.LoginProvider, t.Name });
            entity.ToTable("UserTokens");
        });
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
                .UseSqlite(configuration.GetConnectionString("AliasServerDbContext"))
                .UseLazyLoadingProxies();
        }
    }
}
