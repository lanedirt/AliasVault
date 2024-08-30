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
/// API web application factory fixture for integration tests.
/// </summary>
/// <typeparam name="TEntryPoint">The entry point.</typeparam>
public class WebApplicationApiFactoryFixture<TEntryPoint> : WebApplicationFactory<TEntryPoint>
    where TEntryPoint : class
{
    /// <summary>
    /// The DbConnection instance that is created for the test.
    /// </summary>
    private DbConnection _dbConnection;

    /// <summary>
    /// The DbContextFactory instance that is created for the test.
    /// </summary>
    private IDbContextFactory<AliasServerDbContext> _dbContextFactory = null!;

    /// <summary>
    /// The cached DbContext instance that can be used during the test.
    /// </summary>
    private AliasServerDbContext? _dbContext;

    /// <summary>
    /// Initializes a new instance of the <see cref="WebApplicationApiFactoryFixture{TEntryPoint}"/> class.
    /// </summary>
    public WebApplicationApiFactoryFixture()
    {
        _dbConnection = new SqliteConnection("DataSource=:memory:");
        _dbConnection.Open();
    }

    /// <summary>
    /// Gets or sets the URL the web application host will listen on.
    /// </summary>
    public string HostUrl { get; set; } = "https://localhost:5001";

    /// <summary>
    /// Gets the time provider instance for mutating the current time in tests.
    /// </summary>
    public TestTimeProvider TimeProvider { get; private set; } = new();

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
    /// Disposes the DbConnection instance.
    /// </summary>
    /// <returns>ValueTask.</returns>
    public override ValueTask DisposeAsync()
    {
        _dbConnection.Dispose();
        GC.SuppressFinalize(this);
        return base.DisposeAsync();
    }

    /// <inheritdoc />
    protected override IHost CreateHost(IHostBuilder builder)
    {
        var dummyHost = builder.Build();

        builder.ConfigureWebHost(webHostBuilder => webHostBuilder.UseKestrel());

        var host = builder.Build();
        host.Start();

        // Get the DbContextFactory instance and store it for later use during tests.
        _dbContextFactory = host.Services.GetRequiredService<IDbContextFactory<AliasServerDbContext>>();

        // This delay prevents "ERR_CONNECTION_REFUSED" errors
        // which happened like 1 out of 10 times when running tests.
        Thread.Sleep(100);

        return dummyHost;
    }

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseUrls(HostUrl);

        SetEnvironmentVariables();

        builder.ConfigureServices((context, services) =>
        {
            // Remove existing registrations
            RemoveExistingRegistrations(services);

            // Add new registrations
            AddNewRegistrations(services);
        });
    }

    /// <summary>
    /// Sets the required environment variables for testing.
    /// </summary>
    private static void SetEnvironmentVariables()
    {
        Environment.SetEnvironmentVariable("JWT_KEY", "12345678901234567890123456789012");
        Environment.SetEnvironmentVariable("DATA_PROTECTION_CERT_PASS", "Development");
    }

    /// <summary>
    /// Removes existing service registrations.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to modify.</param>
    private static void RemoveExistingRegistrations(IServiceCollection services)
    {
        var descriptorsToRemove = new[]
        {
            services.SingleOrDefault(d => d.ServiceType == typeof(ITimeProvider)),
            services.SingleOrDefault(d => d.ServiceType == typeof(IDbContextFactory<AliasServerDbContext>)),
            services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AliasServerDbContext>)),
        };

        foreach (var descriptor in descriptorsToRemove)
        {
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }
        }
    }

    /// <summary>
    /// Adds new service registrations.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to modify.</param>
    private void AddNewRegistrations(IServiceCollection services)
    {
        // Add the DbConnection as a singleton
        services.AddSingleton(_dbConnection);

        // Add the DbContextFactory
        services.AddDbContextFactory<AliasServerDbContext>((container, options) =>
        {
            var connection = container.GetRequiredService<DbConnection>();
            options.UseSqlite(connection).UseLazyLoadingProxies();
        });

        // Add TestTimeProvider
        services.AddSingleton<ITimeProvider>(TimeProvider);
    }
}
