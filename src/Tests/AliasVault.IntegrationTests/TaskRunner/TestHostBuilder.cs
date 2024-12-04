//-----------------------------------------------------------------------
// <copyright file="TestHostBuilder.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.TaskRunner;

using System.Data.Common;
using AliasServerDb;
using AliasVault.Shared.Server.Services;
using AliasVault.TaskRunner;
using AliasVault.TaskRunner.Tasks;
using AliasVault.TaskRunner.Workers;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Builder class for creating a test host for the TaskRunner in order to run integration tests against it.
/// </summary>
public class TestHostBuilder
{
    /// <summary>
    /// The DbConnection instance that is created for the test.
    /// </summary>
    private DbConnection? _dbConnection;

    private AliasServerDbContext? _dbContext;

    /// <summary>
    /// Returns the DbContext instance for the test.
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
    /// Builds the TaskRunner test host.
    /// </summary>
    /// <returns>IHost.</returns>
    public IHost Build()
    {
        // Create a persistent in-memory database for the duration of the test
        var dbConnection = new SqliteConnection("DataSource=:memory:");
        dbConnection.Open();
        _dbConnection = dbConnection;

        var builder = Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                services.AddSingleton(new Config());
                services.AddSingleton(_dbConnection);

                services.AddDbContextFactory<AliasServerDbContext>((sp, options) =>
                {
                    var connection = sp.GetRequiredService<DbConnection>();
                    options.UseSqlite(connection);
                });

                // Add server settings service
                services.AddSingleton<ServerSettingsService>();

                // Add maintenance tasks
                services.AddTransient<IMaintenanceTask, LogCleanupTask>();
                services.AddTransient<IMaintenanceTask, EmailCleanupTask>();
                services.AddTransient<IMaintenanceTask, EmailQuotaCleanupTask>();

                // Add the TaskRunner worker
                services.AddHostedService<TaskRunnerWorker>();

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
