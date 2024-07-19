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
    public IHost Build(Action<IServiceCollection> configureServices = null)
    {
        var builder = Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                // Add your services here, similar to your Program.cs
                services.AddSingleton(new Config
                {
                    AllowedToDomains = new List<string> { "example.tld" },
                    SmtpTlsEnabled = "false"
                });

                services.AddSingleton<DbConnection>(sp =>
                {
                    var connection = new SqliteConnection("DataSource=:memory:");
                    connection.Open();
                    return connection;
                });

                services.AddDbContextFactory<AliasServerDbContext>((sp, options) =>
                {
                    var connection = sp.GetRequiredService<DbConnection>();
                    options.UseSqlite(connection).UseLazyLoadingProxies();
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

                // Allow additional service configuration from the test
                configureServices.Invoke(services);
            });

        return builder.Build();
    }
}
