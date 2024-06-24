using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace SqliteWasm;

/// <summary>
/// Extensions for ease of use.
/// </summary>
public static class Extensions
{
    /// <summary>
    /// Add helper factory.
    /// </summary>
    /// <typeparam name="TContext">The <see cref="DbContext"/> being wrapped.</typeparam>
    /// <param name="serviceCollection">The <see cref="IServiceCollection"/>.</param>
    /// <param name="optionsAction">An action used to configure <see cref="DbContextOptions{TContext}"/>.
    /// </param>
    /// <param name="lifetime">Lifetime of the service.</param>
    /// <returns>The service implementation.</returns>
    public static IServiceCollection AddSqliteWasmDbContextFactory<TContext>(
        this IServiceCollection serviceCollection,
        Action<DbContextOptionsBuilder>? optionsAction = null,
        ServiceLifetime lifetime = ServiceLifetime.Singleton)
        where TContext : DbContext
        => AddSqliteWasmDbContextFactory<TContext>(
            serviceCollection,
            optionsAction == null ? null : (_, oa) => optionsAction(oa),
            lifetime);

    /// <summary>
    /// Add helper factory.
    /// </summary>
    /// <typeparam name="TContext">The <see cref="DbContext"/> being wrapped.</typeparam>
    /// <param name="serviceCollection">The <see cref="IServiceCollection"/>.</param>
    /// <param name="optionsAction">An action used to configure <see cref="DbContextOptions{TContext}"/>.
    /// </param>
    /// <param name="lifetime">Lifetime of the service.</param>
    /// <returns>The service implementation.</returns>
    public static IServiceCollection AddSqliteWasmDbContextFactory<TContext>(
       this IServiceCollection serviceCollection,
       Action<IServiceProvider, DbContextOptionsBuilder>? optionsAction,
       ServiceLifetime lifetime = ServiceLifetime.Singleton)
       where TContext : DbContext
    {
        /*serviceCollection.TryAdd(
            new ServiceDescriptor(
                typeof(IBrowserCache),
                typeof(BrowserCache),
                ServiceLifetime.Singleton));

        serviceCollection.TryAdd(
            new ServiceDescriptor(
                typeof(ISqliteSwap),
                typeof(SqliteSwap),
                ServiceLifetime.Singleton));
        */

        serviceCollection.TryAdd(
            new ServiceDescriptor(
                typeof(SqliteWasmDbContextFactory<TContext>),
                typeof(SqliteWasmDbContextFactory<TContext>),
                ServiceLifetime.Singleton));

        serviceCollection.AddDbContextFactory<TContext>(
            optionsAction ?? ((s, p) => { }), lifetime);

        //serviceCollection.AddSingleton<IMigration>(migration ?? new(false));

        return serviceCollection;
    }
}
