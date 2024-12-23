//-----------------------------------------------------------------------
// <copyright file="WebApplicationAdminFactoryFixture.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Infrastructure;

using AliasServerDb;
using AliasVault.Admin.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

/// <summary>
/// Admin web application factory fixture for integration tests.
/// </summary>
/// <typeparam name="TEntryPoint">The entry point.</typeparam>
public class WebApplicationAdminFactoryFixture<TEntryPoint> : WebApplicationFactory<TEntryPoint>
    where TEntryPoint : class
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
    /// The name of the temporary test database.
    /// </summary>
    private string? _tempDbName;

    /// <summary>
    /// Gets or sets the port the web application kestrel host will listen on.
    /// </summary>
    public int Port { get; set; } = 5003;

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
    /// Disposes the DbConnection instance and drops the temporary database.
    /// </summary>
    /// <returns>Task.</returns>
    public override async ValueTask DisposeAsync()
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

            // Then drop the database in a separate command
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = $"""
                                   DROP DATABASE IF EXISTS "{_tempDbName}";
                                   """;
                await cmd.ExecuteNonQueryAsync();
            }
        }

        GC.SuppressFinalize(this);
        await base.DisposeAsync();
    }

    /// <inheritdoc />
    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureWebHost(webHostBuilder =>
        {
            webHostBuilder.UseKestrel(opt => opt.ListenLocalhost(Port));
            webHostBuilder.ConfigureServices(s => s.AddSingleton<IServer, KestrelTestServer>());
        });

        var host = base.CreateHost(builder);

        // Get the DbContextFactory instance and store it for later use during tests.
        _dbContextFactory = host.Services.GetRequiredService<IAliasServerDbContextFactory>();

        return host;
    }

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _tempDbName = $"aliasdb_test_{Guid.NewGuid()}";
        SetEnvironmentVariables();

        builder.ConfigureServices(services =>
        {
            RemoveExistingRegistrations(services);
            AddNewRegistrations(services);
        });
    }

    /// <summary>
    /// Removes existing service registrations.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to modify.</param>
    private static void RemoveExistingRegistrations(IServiceCollection services)
    {
        var descriptorsToRemove = services.Where(d =>
            d.ServiceType == typeof(VersionedContentService)).ToList();

        foreach (var descriptor in descriptorsToRemove)
        {
            services.Remove(descriptor);
        }
    }

    /// <summary>
    /// Sets the required environment variables for testing.
    /// </summary>
    private void SetEnvironmentVariables()
    {
        Environment.SetEnvironmentVariable("ConnectionStrings__AliasServerDbContext", "Host=postgres;Database=" + _tempDbName + ";Username=aliasvault;Password=password");
        Environment.SetEnvironmentVariable("ADMIN_PASSWORD_HASH", "AQAAAAIAAYagAAAAEKWfKfa2gh9Z72vjAlnNP1xlME7FsunRznzyrfqFte40FToufRwa3kX8wwDwnEXZag==");
        Environment.SetEnvironmentVariable("ADMIN_PASSWORD_GENERATED", "2024-01-01T00:00:00Z");
        Environment.SetEnvironmentVariable("DATA_PROTECTION_CERT_PASS", "Development");
    }

    /// <summary>
    /// Adds new service registrations.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to modify.</param>
    private void AddNewRegistrations(IServiceCollection services)
    {
        // Add the VersionedContentService
        services.AddSingleton(new VersionedContentService("../../../../../AliasVault.Admin/wwwroot"));

        // Configure ServerSideBlazor with detailed errors
        services.AddServerSideBlazor()
            .AddCircuitOptions(options => options.DetailedErrors = true);
    }
}
