//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Reflection;
using AliasServerDb;
using AliasServerDb.Configuration;
using AliasVault.Logging;
using AliasVault.Shared.Server.Services;
using AliasVault.TaskRunner.Tasks;
using AliasVault.TaskRunner.Workers;
using AliasVault.WorkerStatus.ServiceExtensions;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
builder.Services.ConfigureLogging(builder.Configuration, Assembly.GetExecutingAssembly().GetName().Name!, "../../../logs");

builder.Services.AddAliasVaultSqliteConfiguration();

// -----------------------------------------------------------------------
// Register hosted services via Status library wrapper in order to monitor and control (start/stop) them via the database.
// -----------------------------------------------------------------------
builder.Services.AddSingleton<ServerSettingsService>();

// Define the tasks that will be executed by the TaskRunner.
builder.Services.AddTransient<IMaintenanceTask, LogCleanupTask>();
builder.Services.AddTransient<IMaintenanceTask, RefreshTokenCleanupTask>();
builder.Services.AddTransient<IMaintenanceTask, EmailCleanupTask>();
builder.Services.AddTransient<IMaintenanceTask, EmailQuotaCleanupTask>();

builder.Services.AddStatusHostedService<TaskRunnerWorker, AliasServerDbContext>(Assembly.GetExecutingAssembly().GetName().Name!);

var host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var container = scope.ServiceProvider;
    var factory = container.GetRequiredService<IDbContextFactory<AliasServerDbContext>>();
    await using var context = await factory.CreateDbContextAsync();
    await context.Database.MigrateAsync();
}

await host.RunAsync();
