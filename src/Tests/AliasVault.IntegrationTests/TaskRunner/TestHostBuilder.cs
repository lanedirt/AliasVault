//-----------------------------------------------------------------------
// <copyright file="TestHostBuilder.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.TaskRunner;

using AliasServerDb;
using AliasServerDb.Configuration;
using AliasVault.Shared.Server.Services;
using AliasVault.TaskRunner.Tasks;
using AliasVault.TaskRunner.Workers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

/// <summary>
/// Builder class for creating a test host for the TaskRunner in order to run integration tests against it.
/// </summary>
public class TestHostBuilder : IAsyncDisposable
{
    /// <summary>
    /// The DbContextFactory instance that is created for the test.
    /// </summary>
    private IAliasServerDbContextFactory _dbContextFactory = null!;

    /// <summary>
    /// The cached DbContext instance that can be used during the test.
    /// </summary>
    private AliasServerDbContext? _dbContext;

    /// <summary>
    /// The temporary database name for the test.
    /// </summary>
    private string? _tempDbName;

    /// <summary>
    /// Returns the DbContext instance for the test. This can be used to seed the database with test data.
    /// </summary>
    /// <returns>AliasServerDbContext instance.</returns>
    public async Task<AliasServerDbContext> GetDbContextAsync()
    {
        return await _dbContextFactory.CreateDbContextAsync();
    }

    /// <summary>
    /// Builds the TaskRunner test host.
    /// </summary>
    /// <returns>IHost.</returns>
    public IHost Build()
    {
        // Create a temporary database for the test
        _tempDbName = $"aliasdb_test_{Guid.NewGuid()}";

        // Create a connection to 'postgres' database to create the test database
        using (var conn = new NpgsqlConnection("Host=localhost;Port=5433;Database=postgres;Username=aliasvault;Password=password"))
        {
            conn.Open();
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = $"""
                    CREATE DATABASE "{_tempDbName}";
                    """;
                cmd.ExecuteNonQuery();
            }
        }

        // Create the connection to the new test database
        var dbConnection = new NpgsqlConnection($"Host=localhost;Port=5433;Database={_tempDbName};Username=aliasvault;Password=password");
        var builder = Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                // Override configuration
                var configuration = new ConfigurationBuilder()
                    .AddJsonFile("appsettings.json", optional: true)
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["DatabaseProvider"] = "postgresql",
                        ["ConnectionStrings:AliasServerDbContext"] = dbConnection.ConnectionString,
                    })
                    .Build();
                services.AddSingleton<IConfiguration>(configuration);

                // Add server settings service
                services.AddSingleton<ServerSettingsService>();

                // Add maintenance tasks
                services.AddTransient<IMaintenanceTask, LogCleanupTask>();
                services.AddTransient<IMaintenanceTask, EmailCleanupTask>();
                services.AddTransient<IMaintenanceTask, EmailQuotaCleanupTask>();

                services.AddAliasVaultDatabaseConfiguration(configuration);

                // Add the TaskRunner worker
                services.AddHostedService<TaskRunnerWorker>();

                // Ensure the database is populated with tables
                var serviceProvider = services.BuildServiceProvider();
                using (var scope = serviceProvider.CreateScope())
                {
                    _dbContextFactory = scope.ServiceProvider.GetRequiredService<IAliasServerDbContextFactory>();
                    var dbContext = _dbContextFactory.CreateDbContext();
                    dbContext.Database.Migrate();
                }
            });

        return builder.Build();
    }

    /// <summary>
    /// Disposes of the test host and cleans up the temporary database.
    /// </summary>
    /// <returns>A <see cref="ValueTask"/> representing the asynchronous operation.</returns>
    public async ValueTask DisposeAsync()
    {
        if (_dbContext != null)
        {
            await _dbContext.DisposeAsync();
            _dbContext = null;
        }

        if (!string.IsNullOrEmpty(_tempDbName))
        {
            // Create a connection to 'postgres' database to drop the test database
            using var conn = new NpgsqlConnection("Host=localhost;Port=5433;Database=postgres;Username=aliasvault;Password=password");
            await conn.OpenAsync();

            // First terminate existing connections
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = $"""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = '{_tempDbName}';
                    """;
                await cmd.ExecuteNonQueryAsync();
            }

            // Then drop the database
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = $"""
                    DROP DATABASE IF EXISTS "{_tempDbName}";
                    """;
                await cmd.ExecuteNonQueryAsync();
            }
        }
    }
}
