using Microsoft.Data.Sqlite;

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
    private static SqliteConnection _sharedConnection;

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
        EnsureSharedConnection();
    }

    /// <summary>
    /// Create a new <see cref="DbContext"/>.
    /// </summary>
    /// <returns>The new instance.</returns>
    public async Task<TContext> CreateDbContextAsync()
    {
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

        // Decrypt the database file/binary string
        //string encryptedBase64String = "your_encrypted_base64_string_here";
        //byte[] encryptedBytes = Convert.FromBase64String(encryptedBase64String);
        //byte[] decryptedBytes = Decrypt(encryptedBytes, EncryptionKey);

        // Create an in-memory SQLite database and load the decrypted data
        string connectionString = "Data Source=:memory:";
        using var connection = new SqliteConnection(connectionString);
        connection.Open();
        //LoadDatabase(connection, decryptedBytes);

        var options = new DbContextOptionsBuilder<TContext>()
            .UseSqlite(connection)
            .Options;

        // Grab the context.
        //var context = await _dbContextFactory.CreateDbContextAsync();

        if (!_initialized)
        {
            Console.WriteLine("Initializing database...");
            Console.WriteLine(context);
            // First time, it should be created.
            //await context.Database.EnsureCreatedAsync();
            await context.Database.MigrateAsync(); // Uncomment if you have migrations

            _initialized = true;
        }

        // Hook into saved changes.
        context.SavedChanges += (o, e) => Context_SavedChanges(context, e);

        return context;

        // Grab the context.
        /*var context = await _dbContextFactory.CreateDbContextAsync();

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

        return context;*/
    }

    /// <summary>
    /// Ensure the shared connection is created.
    /// </summary>
    private static void EnsureSharedConnection()
    {
        if (_sharedConnection == null)
        {
            _sharedConnection = new SqliteConnection("Data Source=:memory:;");
            _sharedConnection.Open();
        }
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
