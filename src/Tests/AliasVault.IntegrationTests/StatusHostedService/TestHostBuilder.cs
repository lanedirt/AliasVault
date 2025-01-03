// -----------------------------------------------------------------------
// <copyright file="TestHostBuilder.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.StatusHostedService;

using System.Data.Common;
using System.Reflection;
using AliasServerDb;
using AliasServerDb.Configuration;
using AliasVault.WorkerStatus.ServiceExtensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

/// <summary>
/// Builder class for creating a test host for the StatusHostedService wrapper in order to run integration tests
/// against it. This primarily tests basic functionality of the hosted service such as starting, stopping and error
/// handling.
///
/// The StatusHostedService is a wrapper around the HostedService class that provides additional functionality for
/// managing the status of the hosted service. This includes being able to start and stop the services from the
/// AliasVault admin panel.
/// </summary>
public class TestHostBuilder : AbstractTestHostBuilder
{
    /// <summary>
    /// Builds the test host for the TestExceptionWorker.
    /// </summary>
    /// <returns>IHost.</returns>
    public IHost Build()
    {
        // Get base builder with database connection already configured.
        var builder = CreateBuilder();

        // Add specific services for the TestExceptionWorker.
        builder.ConfigureServices((context, services) =>
        {
            services.AddStatusHostedService<TestExceptionWorker, AliasServerDbContext>(Assembly.GetExecutingAssembly().GetName().Name!);
        });

        return builder.Build();
    }
}
