// -----------------------------------------------------------------------
// <copyright file="TestHostBuilder.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.SmtpServer;

using AliasVault.SmtpService;
using AliasVault.SmtpService.Handlers;
using AliasVault.SmtpService.Workers;
using global::SmtpServer;
using global::SmtpServer.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Builder class for creating a test host for the SmtpServiceWorker in order to run integration tests against it.
/// </summary>
public class TestHostBuilder : AbstractTestHostBuilder
{
    /// <summary>
    /// Builds the SmtpService test host with a provided database connection.
    /// </summary>
    /// <returns>IHost.</returns>
    public IHost Build()
    {
        // Get base builder with database connection already configured.
        var builder = CreateBuilder();

        // Add specific services for the TestExceptionWorker.
        builder.ConfigureServices((context, services) =>
        {
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

            services.AddHostedService<SmtpServerWorker>();
        });

        return builder.Build();
    }
}
