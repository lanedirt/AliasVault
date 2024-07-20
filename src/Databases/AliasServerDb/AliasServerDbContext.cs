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
    /// Gets or sets the AliasVaultUserRoles DbSet.
    /// </summary>
    public DbSet<AliasVaultUserRole> AliasVaultUserRoles { get; set; }

    /// <summary>
    /// Gets or sets the AliasVaultUserClaims DbSet.
    /// </summary>
    public DbSet<AliasVaultUserClaim> AliasVaultUserClaims { get; set; }

    /// <summary>
    /// Gets or sets the AliasVaultUserLogins DbSet.
    /// </summary>
    public DbSet<AliasVaultUserLogin> AliasVaultUserLogins { get; set; }

    /// <summary>
    /// Gets or sets the AliasVaultRoleClaims DbSet.
    /// </summary>
    public DbSet<AliasVaultRoleClaim> AliasVaultRoleClaims { get; set; }

    /// <summary>
    /// Gets or sets the AliasVaultUserTokens DbSet.
    /// </summary>
    public DbSet<AliasVaultUserToken> AliasVaultUserTokens { get; set; }

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
    /// Gets or sets the AdminUserRoles DbSet.
    /// </summary>
    public DbSet<AdminUserRole> AdminUserRoles { get; set; }

    /// <summary>
    /// Gets or sets the AdminUserClaims DbSet.
    /// </summary>
    public DbSet<AdminUserClaim> AdminUserClaims { get; set; }

    /// <summary>
    /// Gets or sets the AdminUserLogins DbSet.
    /// </summary>
    public DbSet<AdminUserLogin> AdminUserLogins { get; set; }

    /// <summary>
    /// Gets or sets the AdminRoleClaims DbSet.
    /// </summary>
    public DbSet<AdminRoleClaim> AdminRoleClaims { get; set; }

    /// <summary>
    /// Gets or sets the AdminUserTokens DbSet.
    /// </summary>
    public DbSet<AdminUserToken> AdminUserTokens { get; set; }

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
         // AliasVaultUser tables
        builder.Entity<AliasVaultUser>(entity =>
        {
            entity.ToTable("AliasVaultUsers");
        });

        builder.Entity<AliasVaultRole>(entity =>
        {
            entity.ToTable("AliasVaultRoles");
        });

        builder.Entity<AliasVaultUserRole>(entity =>
        {
            entity.HasKey(r => new { r.UserId, r.RoleId });
            entity.ToTable("AliasVaultUserRoles");
            entity.HasOne<AliasVaultUser>()
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .IsRequired();
        });

        builder.Entity<AliasVaultUserClaim>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.ToTable("AliasVaultUserClaims");
            entity.HasOne<AliasVaultUser>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .IsRequired();
        });

        builder.Entity<AliasVaultUserLogin>(entity =>
        {
            entity.HasKey(l => new { l.LoginProvider, l.ProviderKey });
            entity.ToTable("AliasVaultUserLogins");
            entity.HasOne<AliasVaultUser>()
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .IsRequired();
        });

        builder.Entity<AliasVaultRoleClaim>(entity =>
        {
            entity.HasKey(rc => rc.Id);
            entity.ToTable("AliasVaultRoleClaims");
        });

        builder.Entity<AliasVaultUserToken>(entity =>
        {
            entity.HasKey(t => new { t.UserId, t.LoginProvider, t.Name });
            entity.ToTable("AliasVaultUserTokens");
            entity.HasOne<AliasVaultUser>()
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .IsRequired();
        });

        // AdminUser tables
        builder.Entity<AdminUser>(entity =>
        {
            entity.ToTable("AdminUsers");
        });

        builder.Entity<AdminUserRole>(entity =>
        {
            entity.ToTable("AdminRoles");
        });

        builder.Entity<AdminUserRole>(entity =>
        {
            entity.HasKey(r => new { r.UserId, r.RoleId });
            entity.ToTable("AdminUserRoles");
            entity.HasOne<AdminUser>()
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .IsRequired();
        });

        builder.Entity<AdminUserClaim>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.ToTable("AdminUserClaims");
            entity.HasOne<AdminUser>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .IsRequired();
        });

        builder.Entity<AdminUserLogin>(entity =>
        {
            entity.HasKey(l => new { l.LoginProvider, l.ProviderKey });
            entity.ToTable("AdminUserLogins");
            entity.HasOne<AdminUser>()
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .IsRequired();
        });

        builder.Entity<AdminRoleClaim>(entity =>
        {
            entity.HasKey(rc => rc.Id);
            entity.ToTable("AdminRoleClaims");
        });

        builder.Entity<AdminUserToken>(entity =>
        {
            entity.HasKey(t => new { t.UserId, t.LoginProvider, t.Name });
            entity.ToTable("AdminUserTokens");
            entity.HasOne<AdminUser>()
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .IsRequired();
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
