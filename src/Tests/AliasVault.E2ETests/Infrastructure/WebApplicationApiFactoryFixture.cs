//-----------------------------------------------------------------------
// <copyright file="WebApplicationApiFactoryFixture.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Infrastructure;

using System.Data.Common;
using AliasServerDb;
using AliasVault.Shared.Providers.Time;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Web application factory fixture for integration tests.
/// </summary>
/// <typeparam name="TEntryPoint">The entry point.</typeparam>
public class WebApplicationApiFactoryFixture<TEntryPoint> : WebApplicationFactory<TEntryPoint>
    where TEntryPoint : class
{
    /// <summary>
    /// Gets or sets the URL the web application host will listen on.
    /// </summary>
    public string HostUrl { get; set; } = "https://localhost:5001";

    /// <summary>
    /// Gets the time provider instance for mutating the current time in tests.
    /// </summary>
    public TestTimeProvider TimeProvider { get; private set; } = new();

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseUrls(HostUrl);

        // Set the JWT key environment variable to debug value.
        Environment.SetEnvironmentVariable("JWT_KEY", "12345678901234567890123456789012");

        builder.ConfigureServices((context, services) =>
        {
            // Replace the ITimeProvider registration with a TestTimeProvider.
            var timeProviderDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(ITimeProvider));

            if (timeProviderDescriptor is null)
            {
                throw new InvalidOperationException(
                    "No ITimeProvider registered.");
            }

            services.Remove(timeProviderDescriptor);

            // Add TestTimeProvider
            services.AddSingleton<ITimeProvider>(TimeProvider);

            // Remove the existing AliasServerDbContext registration.
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType ==
                     typeof(DbContextOptions<AliasServerDbContext>));

            if (dbContextDescriptor is null)
            {
                throw new InvalidOperationException(
                    "No DbContextOptions<AliasServerDbContext> registered.");
            }

            services.Remove(dbContextDescriptor);

            // Remove the existing DbConnection registration.
            var dbConnectionDescriptor = services.SingleOrDefault(
                d => d.ServiceType ==
                     typeof(DbConnection));

            if (dbConnectionDescriptor is null)
            {
                throw new InvalidOperationException(
                    "No DbContextOptions<AliasServerDbContext> registered.");
            }

            services.Remove(dbConnectionDescriptor);

            // Create a new DbConnection and AliasServerDbContext with an in-memory database.
            services.AddSingleton<DbConnection>(container =>
            {
                var connection = new SqliteConnection("DataSource=:memory:");
                connection.Open();

                return connection;
            });

            services.AddDbContext<AliasServerDbContext>((container, options) =>
            {
                var connection = container.GetRequiredService<DbConnection>();
                options.UseSqlite(connection);
            });
        });
    }

    /// <inheritdoc />
    protected override IHost CreateHost(IHostBuilder builder)
    {
        var dummyHost = builder.Build();

        builder.ConfigureWebHost(webHostBuilder => webHostBuilder.UseKestrel());

        var host = builder.Build();
        host.Start();

        // This delay prevents "ERR_CONNECTION_REFUSED" errors
        // which happened like 1 out of 10 times when running tests.
        Thread.Sleep(100);

        return dummyHost;
    }
}
