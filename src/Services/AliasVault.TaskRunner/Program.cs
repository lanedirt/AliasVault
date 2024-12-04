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
using AliasVault.TaskRunner.Workers;
using AliasVault.WorkerStatus.ServiceExtensions;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
builder.Services.ConfigureLogging(builder.Configuration, Assembly.GetExecutingAssembly().GetName().Name!, "../../../logs");

// Create global config object, get values from environment variables.
Config config = new Config();
var emailDomains = Environment.GetEnvironmentVariable("PRIVATE_EMAIL_DOMAINS")
                   ?? throw new KeyNotFoundException("PRIVATE_EMAIL_DOMAINS environment variable is not set.");
config.AllowedToDomains = emailDomains.Split(',').ToList();

var tlsEnabled = Environment.GetEnvironmentVariable("SMTP_TLS_ENABLED")
                 ?? throw new KeyNotFoundException("SMTP_TLS_ENABLED environment variable is not set.");
config.SmtpTlsEnabled = tlsEnabled;
builder.Services.AddSingleton(config);

builder.Services.AddAliasVaultSqliteConfiguration();

// -----------------------------------------------------------------------
// Register hosted services via Status library wrapper in order to monitor and control (start/stop) them via the database.
// -----------------------------------------------------------------------
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
