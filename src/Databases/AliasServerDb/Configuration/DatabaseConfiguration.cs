//-----------------------------------------------------------------------
// <copyright file="DatabaseConfiguration.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb.Configuration;

using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Database configuration class.
/// </summary>
public static class DatabaseConfiguration
{
    /// <summary>
    /// Configures SQLite for use with Entity Framework Core.
    /// </summary>
    /// <param name="services">The IServiceCollection to add the DbContext to.</param>
    /// <returns>The IServiceCollection for method chaining.</returns>
    public static IServiceCollection AddAliasVaultSqliteConfiguration(this IServiceCollection services)
    {
        var serviceProvider = services.BuildServiceProvider();
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();

        var connectionString = configuration.GetConnectionString("AliasServerDbContext");
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Connection string 'AliasServerDbContext' not found.");
        }

        var sqliteConnectionStringBuilder = new SqliteConnectionStringBuilder(connectionString)
        {
            Cache = SqliteCacheMode.Private,
            Mode = SqliteOpenMode.ReadWriteCreate,
        };

        services.AddDbContextFactory<AliasServerDbContext>(options =>
        {
            options.UseSqlite(CreateAndConfigureSqliteConnection(sqliteConnectionStringBuilder.ConnectionString), sqliteOptions =>
            {
                sqliteOptions.CommandTimeout(60);
            }).UseLazyLoadingProxies();
        });

        return services;
    }

    private static DbConnection CreateAndConfigureSqliteConnection(string connectionString)
    {
        var connection = new SqliteConnection(connectionString);
        connection.Open();
        return connection;
    }
}
