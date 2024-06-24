namespace SqliteWasm;

using Microsoft.EntityFrameworkCore;

/// <summary>
/// SqliteWasm DbContextFactory implementation.
/// </summary>
/// <typeparam name="TContext">The <see cref="DbContext"/>.</typeparam>
public class SqliteWasmDbContextFactory<TContext>
    where TContext : DbContext
{
    private readonly IDbContextFactory<TContext> _dbContextFactory;

    /// <summary>
    /// Gets or sets whether database has initialized already.
    /// </summary>
    private bool _initialized = false;

    /// <summary>
    /// Initializes a new instance of the <see cref="SqliteWasmDbContextFactory{TContext}"/> class.
    /// </summary>
    /// <param name="dbContextFactory">The EF Core-provided factory.</param>
    public SqliteWasmDbContextFactory(
        IDbContextFactory<TContext> dbContextFactory)
    {
        _dbContextFactory = dbContextFactory;
    }

    /// <summary>
    /// Create a new <see cref="DbContext"/>.
    /// </summary>
    /// <returns>The new instance.</returns>
    public async Task<TContext> CreateDbContextAsync()
    {
        // Grab the context.
        var context = await _dbContextFactory.CreateDbContextAsync();

        if (!_initialized)
        {
            // First time, it should be created.
            await context.Database.EnsureCreatedAsync();
            // MigrateAsync() undefined??
            // await context.Database.MigrateAsync();

            _initialized = true;
        }

        // Hook into saved changes.
        context.SavedChanges += (o, e) => Context_SavedChanges(context, e);

        return context;
    }

    /// <summary>
    /// Hook called when the DbContext SaveChanges() has been called.
    /// </summary>
    /// <param name="ctx"></param>
    /// <param name="e"></param>
    private async void Context_SavedChanges(TContext ctx, SavedChangesEventArgs e)
    {
        Console.WriteLine("DbContext SavedChanged called.");
    }
}
