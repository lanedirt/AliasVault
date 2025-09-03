//-----------------------------------------------------------------------
// <copyright file="DatabaseConfiguration.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb.Configuration;

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
    /// <param name="configuration">The IConfiguration to use for the connection string.</param>
    /// <returns>The IServiceCollection for method chaining.</returns>
    public static IServiceCollection AddAliasVaultDatabaseConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // Check for environment variables first, then fall back to configuration
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__AliasServerDbContext");
        var dbProvider = Environment.GetEnvironmentVariable("DatabaseProvider")?.ToLower()
            ?? configuration.GetValue<string>("DatabaseProvider")?.ToLower()
            ?? "postgresql";

        // Create a new configuration if we have environment-provided values
        if (!string.IsNullOrEmpty(connectionString))
        {
            var configDictionary = new Dictionary<string, string?>
            {
                ["ConnectionStrings:AliasServerDbContext"] = connectionString,
                ["DatabaseProvider"] = dbProvider,
            };

            var configurationBuilder = new ConfigurationBuilder()
                .AddInMemoryCollection(configDictionary);

            // Only add the original configuration after our environment variables
            // This ensures environment variables take precedence
            configurationBuilder.AddConfiguration(configuration).Build();
        }

        // Add custom DbContextFactory registration which supports multiple database providers
        // NOTE: previously we looked at the "dbProvider" flag for which factory to initiate,
        // but as we dropped support for SQLite we now just have this one database provider.
        services.AddSingleton<IAliasServerDbContextFactory, PostgresqlDbContextFactory>();

        // Updated DbContextFactory registration
        services.AddDbContextFactory<AliasServerDbContext>((sp, options) =>
        {
            var factory = sp.GetRequiredService<IAliasServerDbContextFactory>();
            factory.ConfigureDbContextOptions(options);
        });

        // Add scoped DbContext registration based on the factory
        services.AddScoped<AliasServerDbContext>(sp =>
        {
            var factory = sp.GetRequiredService<IAliasServerDbContextFactory>();
            return factory.CreateDbContext();
        });

        return services;
    }
}
