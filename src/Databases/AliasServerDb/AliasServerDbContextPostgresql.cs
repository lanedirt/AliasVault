//-----------------------------------------------------------------------
// <copyright file="AliasServerDbContextPostgresql.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

/// <summary>
/// PostgreSQL implementation of the AliasServerDbContext.
/// </summary>
public class AliasServerDbContextPostgresql : AliasServerDbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AliasServerDbContextPostgresql"/> class.
    /// </summary>
    public AliasServerDbContextPostgresql()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasServerDbContextPostgresql"/> class.
    /// </summary>
    /// <param name="options">DbContextOptions.</param>
    public AliasServerDbContextPostgresql(DbContextOptions<AliasServerDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Sets up the connection string if it is not already configured.
    /// </summary>
    /// <param name="optionsBuilder">DbContextOptionsBuilder instance.</param>
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

        if (optionsBuilder.IsConfigured)
        {
            return;
        }

        var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

        // Add SQLite connection with enhanced settings
        var connectionString = configuration.GetConnectionString("AliasServerDbContext");

        optionsBuilder
            .UseNpgsql(connectionString, options => options.CommandTimeout(60))
            .UseLazyLoadingProxies();
    }
}
