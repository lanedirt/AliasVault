//-----------------------------------------------------------------------
// <copyright file="WebApplicationAdminFactoryFixture.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Infrastructure;

using System.Data.Common;
using AliasServerDb;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Admin web application factory fixture for integration tests.
/// </summary>
/// <typeparam name="TEntryPoint">The entry point.</typeparam>
public class WebApplicationAdminFactoryFixture<TEntryPoint> : WebApplicationFactory<TEntryPoint>
    where TEntryPoint : class
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
    /// Gets or sets the URL the web application host will listen on.
    /// </summary>
    public string HostUrl { get; set; } = "https://localhost:5003";

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

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseUrls(HostUrl);

        // Set static environment variables for the test.
        // These are used in the Admin project to set the admin password hash and last password change date.
        // An admin user will automatically be created with these values if the database is empty.
        Environment.SetEnvironmentVariable("ADMIN_PASSWORD_HASH", "AQAAAAIAAYagAAAAEKWfKfa2gh9Z72vjAlnNP1xlME7FsunRznzyrfqFte40FToufRwa3kX8wwDwnEXZag==");
        Environment.SetEnvironmentVariable("ADMIN_PASSWORD_GENERATED", "2024-01-01T00:00:00Z");

        builder.ConfigureServices((context, services) =>
        {
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

            // Remove the existing AliasServerDbContextFactory registration.
            var dbContextFactoryDescriptor = services.SingleOrDefault(
                d => d.ServiceType ==
                     typeof(IDbContextFactory<AliasServerDbContext>));

            if (dbContextFactoryDescriptor is null)
            {
                throw new InvalidOperationException(
                    "No IDbContextFactory<AliasServerDbContext> registered.");
            }

            services.Remove(dbContextFactoryDescriptor);

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
                _dbConnection = new SqliteConnection("DataSource=:memory:");
                _dbConnection.Open();

                return _dbConnection;
            });

            services.AddDbContext<AliasServerDbContext>((container, options) =>
            {
                var connection = container.GetRequiredService<DbConnection>();
                options.UseSqlite(connection);
            });

            // Add the IDbContextFactory<AliasServerDbContext> as a scoped service
            services.AddScoped<IDbContextFactory<AliasServerDbContext>, PooledDbContextFactory<AliasServerDbContext>>();

            // Enable detailed errors for server-side Blazor.
            services.AddServerSideBlazor()
                .AddCircuitOptions(options =>
                {
                    options.DetailedErrors = true;
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
