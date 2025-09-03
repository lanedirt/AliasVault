//-----------------------------------------------------------------------
// <copyright file="ServiceCollectionExtensions.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WorkerStatus.ServiceExtensions;

using AliasVault.WorkerStatus.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

/// <summary>
/// ServiceCollectionExtensions class.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add a HostedService that is monitored by the StatusWorker.
    /// </summary>
    /// <param name="services">IServiceCollection.</param>
    /// <typeparam name="TWorker">Worker type to add.</typeparam>
    /// <typeparam name="TContext">DBContext type to use for persisting and retrieving the status data.</typeparam>
    /// <param name="serviceName">The unique service name through which the worker processes
    /// can be triggered to start or stop.</param>
    /// <returns>IServiceCollection instance.</returns>
    public static IServiceCollection AddStatusHostedService<TWorker, TContext>(this IServiceCollection services, string serviceName)
        where TWorker : class, IHostedService
        where TContext : DbContext, IWorkerStatusDbContext
    {
        services.TryAddSingleton<TWorker>();
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IHostedService, StatusHostedService<TWorker>>());

        // Only add these required helper services if they are not already registered.
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IHostedService, StatusWorker>());
        services.TryAddSingleton(new GlobalServiceStatus(serviceName));

        // Register the DbContext factory
        services.TryAddSingleton<Func<IWorkerStatusDbContext>>(sp =>
        {
            var factory = sp.GetRequiredService<IDbContextFactory<TContext>>();
            return () => factory.CreateDbContext();
        });

        // Set HostOptions to ignore background service exceptions as we are handling them in the StatusWorker.
        services.Configure<HostOptions>(options =>
        {
            options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
        });

        return services;
    }
}
