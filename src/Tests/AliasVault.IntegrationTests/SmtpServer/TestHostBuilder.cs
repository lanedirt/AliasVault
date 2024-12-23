// -----------------------------------------------------------------------
// <copyright file="TestHostBuilder.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.SmtpServer;

using System.Data.Common;
using AliasServerDb;
using AliasServerDb.Configuration;
using AliasVault.SmtpService;
using AliasVault.SmtpService.Handlers;
using AliasVault.SmtpService.Workers;
using global::SmtpServer;
using global::SmtpServer.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

/// <summary>
/// Builder class for creating a test host for the SmtpServiceWorker in order to run integration tests against it.
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
    public AliasServerDbContext GetDbContext()
    {
        if (_dbContext != null)
        {
            return _dbContext;
        }

        _dbContext = _dbContextFactory.CreateDbContext();
        return _dbContext;
    }

    /// <summary>
    /// Builds the SmtpService test host.
    /// </summary>
    /// <returns>IHost.</returns>
    public IHost Build()
    {
        _tempDbName = $"aliasdb_test_{Guid.NewGuid()}";

        // Create a connection to 'postgres' database to ensure the test database exists
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

        // Create a connection to the new test database
        var dbConnection = new NpgsqlConnection($"Host=localhost;Port=5433;Database={_tempDbName};Username=aliasvault;Password=password");

        return Build(dbConnection);
    }

    /// <summary>
    /// Builds the SmtpService test host with a provided database connection.
    /// </summary>
    /// <param name="dbConnection">The database connection to use for the test.</param>
    /// <returns>IHost.</returns>
    public IHost Build(DbConnection dbConnection)
    {
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

                services.AddSingleton(new Config
                {
                    AllowedToDomains = new List<string> { "example.tld" },
                    SmtpTlsEnabled = "false",
                });

                services.AddTransient<IMessageStore, DatabaseMessageStore>();
                services.AddSingleton<SmtpServer>(
                    provider =>
                    {
                        var options = new SmtpServerOptionsBuilder()
                            .ServerName("aliasvault");

                        // Note: port 25 doesn't work in GitHub actions so we use these instead for the integration tests:
                        // - 2525 for the SMTP server
                        // - 5870 for the submission server
                        options.Endpoint(serverBuilder =>
                                serverBuilder
                                    .Port(2525, false))
                            .Endpoint(serverBuilder =>
                                serverBuilder
                                    .Port(5870, false));

                        return new SmtpServer(options.Build(), provider.GetRequiredService<IServiceProvider>());
                    });

                services.AddAliasVaultDatabaseConfiguration(configuration);
                services.AddHostedService<SmtpServerWorker>();

                // Ensure the in-memory database is populated with tables
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
