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
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using global::SmtpServer;
using global::SmtpServer.Storage;

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
    /// <returns></returns>
    public IHost Build()
    {
        // Create a persistent in-memory database for the duration of the test.
        _dbConnection = new SqliteConnection("DataSource=:memory:");
        _dbConnection.Open();

        var builder = Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                services.AddSingleton(new Config
                {
                    AllowedToDomains = new List<string> { "example.tld" },
                    SmtpTlsEnabled = "false"
                });

                services.AddSingleton(_dbConnection);

                services.AddDbContextFactory<AliasServerDbContext>((sp, options) =>
                {
                    var connection = sp.GetRequiredService<DbConnection>();
                    options.UseSqlite(connection);
                });

                services.AddTransient<IMessageStore, DatabaseMessageStore>();
                services.AddTransient<IMailboxFilter, AllowedDomainsFilter>();

                services.AddSingleton<global::SmtpServer.SmtpServer>(
                    provider =>
                    {
                        var options = new SmtpServerOptionsBuilder()
                            .ServerName("aliasvault");

                        // No TLS
                        options.Endpoint(serverBuilder =>
                                serverBuilder
                                    .Port(25, false))
                            .Endpoint(serverBuilder =>
                                serverBuilder
                                    .Port(587, false)
                            );

                        return new SmtpServer(options.Build(), provider.GetRequiredService<IServiceProvider>());
                    }
                );

                services.AddHostedService<Worker>();

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
