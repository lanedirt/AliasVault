// -----------------------------------------------------------------------
// <copyright file="TestHostBuilder.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.SmtpServer;

using System.Data.Common;
using AliasServerDb;
using AliasVault.SmtpService;
using AliasVault.SmtpService.Handlers;
using AliasVault.SmtpService.Workers;
using global::SmtpServer;
using global::SmtpServer.Storage;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Builder class for creating a test host for the SmtpServiceWorker in order to run integration tests against it.
/// </summary>
public class TestHostBuilder
{
    /// <summary>
    /// The DbConnection instance that is created for the test.
    /// </summary>
    private DbConnection? _dbConnection;

    /// <summary>
    /// The DbContext instance that is created for the test.
    /// </summary>
    private AliasServerDbContext? _dbContext;

    /// <summary>
    /// Returns the DbContext instance for the test. This can be used to seed the database with test data.
    /// </summary>
    /// <returns>AliasServerDbContext instance.</returns>
    public AliasServerDbContext GetDbContext()
    {
        if (_dbContext == null)
        {
            var options = new DbContextOptionsBuilder<AliasServerDbContext>()
                .UseSqlite(_dbConnection!)
                .Options;

            _dbContext = new AliasServerDbContext(options);
        }

        return _dbContext;
    }

    /// <summary>
    /// Builds the SmtpService test host.
    /// </summary>
    /// <returns>IHost.</returns>
    public IHost Build()
    {
        // Create a persistent in-memory database for the duration of the test.
        var dbConnection = new SqliteConnection("DataSource=:memory:");
        dbConnection.Open();

        return Build(dbConnection);
    }

     /// <summary>
    /// Builds the SmtpService test host with a provided database connection.
    /// </summary>
    /// <param name="dbConnection">The database connection to use for the test.</param>
    /// <returns>IHost.</returns>
    public IHost Build(DbConnection dbConnection)
    {
        // Create a persistent in-memory database for the duration of the test.
        _dbConnection = dbConnection;

        var builder = Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                services.AddSingleton(new Config
                {
                    AllowedToDomains = new List<string> { "example.tld" },
                    SmtpTlsEnabled = "false",
                });

                services.AddSingleton(_dbConnection);

                services.AddDbContextFactory<AliasServerDbContext>((sp, options) =>
                {
                    var connection = sp.GetRequiredService<DbConnection>();
                    options.UseSqlite(connection);
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

                services.AddHostedService<SmtpServerWorker>();

                // Ensure the in-memory database is populated with tables
                var serviceProvider = services.BuildServiceProvider();
                using (var scope = serviceProvider.CreateScope())
                {
                    var dbContextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AliasServerDbContext>>();
                    var dbContext = dbContextFactory.CreateDbContext();
                    dbContext.Database.Migrate();
                }
            });

        return builder.Build();
    }
}
