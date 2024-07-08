//-----------------------------------------------------------------------
// <copyright file="DbService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Services.Database;

using System.Data;
using System.Net.Http.Json;
using AliasClientDb;
using AliasVault.Shared.Models.WebApi;
using AliasVault.WebApp.Services.Auth;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.JSInterop;

/// <summary>
/// Class to manage the in-memory AliasClientDb service. The reason for this service is to provide a way to interact
/// with a AliasClientDb database instance that is only persisted in memory due to the encryption requirements of the
/// database itself. The database should not be persisted to disk when in un-encrypted form.
/// </summary>
public class DbService : IDisposable
{
    private readonly AuthService _authService;
    private readonly IJSRuntime _jsRuntime;
    private readonly HttpClient _httpClient;
    private readonly DbServiceState _state = new();
    private SqliteConnection _sqlConnection;
    private AliasClientDbContext _dbContext;
    private bool _isSuccessfullyInitialized;
    private int _retryCount;
    private bool _disposed;

    /// <summary>
    /// Initializes a new instance of the <see cref="DbService"/> class.
    /// </summary>
    /// <param name="authService">AuthService.</param>
    /// <param name="jsRuntime">IJSRuntime.</param>
    /// <param name="httpClient">HttpClient.</param>
    public DbService(AuthService authService, IJSRuntime jsRuntime, HttpClient httpClient)
    {
        _authService = authService;
        _jsRuntime = jsRuntime;
        _httpClient = httpClient;

        // Set the initial state of the database service.
        _state.UpdateState(DbServiceState.DatabaseStatus.Uninitialized);

        // Create an in-memory SQLite database connection which stays open for the lifetime of the service.
        (_sqlConnection, _dbContext) = InitializeEmptyDatabase();
    }

    /// <summary>
    /// Gets database service state object which can be subscribed to.
    /// </summary>
    /// <returns>DbServiceState instance.</returns>
    public DbServiceState GetState()
    {
        return _state;
    }

    /// <summary>
    /// Initializes the database, either by creating a new one or loading an existing one from the server.
    /// </summary>
    /// <returns>Task.</returns>
    public async Task InitializeDatabaseAsync()
    {
        // Check that encryption key is set. If not, do nothing.
        if (!_authService.IsEncryptionKeySet())
        {
            return;
        }

        _state.UpdateState(DbServiceState.DatabaseStatus.LoadingFromServer);

        // Ensure the in-memory database representation is created and has the necessary tables.
        await _dbContext.Database.MigrateAsync();

        // Attempt to fill the local database with a previously saved database stored on the server.
        var loaded = await LoadDatabaseFromServerAsync();
        if (loaded)
        {
            Console.WriteLine("Database successfully loaded from server.");

            // Check if database is up to date with migrations.
            var pendingMigrations = await _dbContext.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                _state.UpdateState(DbServiceState.DatabaseStatus.PendingMigrations);
            }
            else
            {
                _isSuccessfullyInitialized = true;
                _state.UpdateState(DbServiceState.DatabaseStatus.Ready);
            }
        }
        else
        {
            _state.UpdateState(DbServiceState.DatabaseStatus.DecryptionFailed);
            Console.WriteLine("Failed to load database from server.");
        }
    }

    /// <summary>
    /// Returns the AliasClientDbContext instance.
    /// </summary>
    /// <returns>AliasClientDbContext.</returns>
    public async Task<AliasClientDbContext> GetDbContextAsync()
    {
        if (!_isSuccessfullyInitialized)
        {
            // Retry initialization up to 5 times before giving up.
            if (_retryCount < 5)
            {
                _retryCount++;
                await InitializeDatabaseAsync();
            }
            else
            {
                throw new DataException("Failed to initialize database.");
            }
        }

        return _dbContext;
    }

    /// <summary>
    /// Saves the database to the remote server.
    /// </summary>
    /// <returns>Task.</returns>
    public async Task SaveDatabaseAsync()
    {
        // Set the initial state of the database service.
        _state.UpdateState(DbServiceState.DatabaseStatus.SavingToServer);

        // Save the actual dbContext.
        await _dbContext.SaveChangesAsync();

        string base64String = await ExportSqliteToBase64Async();

        // Encrypt base64 string using IJSInterop.
        string encryptedBase64String = await _jsRuntime.InvokeAsync<string>("cryptoInterop.encrypt", base64String, _authService.GetEncryptionKeyAsBase64Async());

        // Save to webapi.
        var success = await SaveToServerAsync(encryptedBase64String);
        if (success)
        {
            Console.WriteLine("Database succesfully saved to server.");
            _state.UpdateState(DbServiceState.DatabaseStatus.Ready);
        }
        else
        {
            Console.WriteLine("Failed to save database to server.");
            _state.UpdateState(DbServiceState.DatabaseStatus.OperationError);
        }
    }

    /// <summary>
    /// Export the in-memory SQLite database to a base64 string.
    /// </summary>
    /// <returns>Base64 encoded string that represents SQLite database.</returns>
    public async Task<string> ExportSqliteToBase64Async()
    {
        Console.WriteLine("Awaited database initialize...");

        var tempFileName = Path.GetRandomFileName();

        // Export SQLite memory database to a temp file.
        using var memoryStream = new MemoryStream();
        using var command = _sqlConnection.CreateCommand();
        command.CommandText = "VACUUM main INTO @fileName";
        command.Parameters.Add(new SqliteParameter("@fileName", tempFileName));
        await command.ExecuteNonQueryAsync();

        // Get bytes.
        var bytes = await File.ReadAllBytesAsync(tempFileName);
        string base64String = Convert.ToBase64String(bytes);

        // Delete temp file.
        File.Delete(tempFileName);

        return base64String;
    }

    /// <summary>
    /// Migrate the database structure to the latest version.
    /// </summary>
    /// <returns>Bool which indicates if migration was succesful.</returns>
    public async Task<bool> MigrateDatabaseAsync()
    {
        try
        {
            await _dbContext.Database.MigrateAsync();
            _isSuccessfullyInitialized = true;
            _state.UpdateState(DbServiceState.DatabaseStatus.Ready);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            return false;
        }

        return true;
    }

    /// <summary>
    /// Clears the database connection and creates a new one so that the database is empty.
    /// </summary>
    /// <returns>SqliteConnection and AliasClientDbContext.</returns>
    public (SqliteConnection SqliteConnection, AliasClientDbContext AliasClientDbContext) InitializeEmptyDatabase()
    {
        if (_isSuccessfullyInitialized && _sqlConnection.State == ConnectionState.Open)
        {
            _sqlConnection.Close();
        }

        _sqlConnection = new SqliteConnection("Data Source=:memory:");
        _sqlConnection.Open();

        _dbContext = new AliasClientDbContext(_sqlConnection, log => Console.WriteLine(log));

        _isSuccessfullyInitialized = false;

        return (_sqlConnection, _dbContext);
    }

    /// <summary>
    /// Implements the IDisposable interface.
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Disposes the service.
    /// </summary>
    /// <param name="disposing">True if disposing.</param>
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
        {
            return;
        }

        if (disposing)
        {
            _sqlConnection.Dispose();
        }

        _disposed = true;
    }

    /// <summary>
    /// Loads a SQLite database from a base64 string which represents a .sqlite file.
    /// </summary>
    /// <param name="base64String">Base64 string representation of a .sqlite file.</param>
    private async Task ImportDbContextFromBase64Async(string base64String)
    {
        var bytes = Convert.FromBase64String(base64String);
        var tempFileName = Path.GetRandomFileName();
        await File.WriteAllBytesAsync(tempFileName, bytes);

        /*using (var command = _sqlConnection.CreateCommand())
        {
            // Empty all tables in the original database
            command.CommandText = @"
                SELECT 'DELETE FROM ' || name || ';'
                FROM sqlite_master
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%';";
            var emptyTableCommands = new List<string>();
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    emptyTableCommands.Add(reader.GetString(0));
                }
            }

            foreach (var emptyTableCommand in emptyTableCommands)
            {
                command.CommandText = emptyTableCommand;
                await command.ExecuteNonQueryAsync();
            }

            // Attach the imported database and copy tables
            command.CommandText = "ATTACH DATABASE @fileName AS importDb";
            command.Parameters.Add(new SqliteParameter("@fileName", tempFileName));
            await command.ExecuteNonQueryAsync();

            command.CommandText = @"
                SELECT 'INSERT INTO main.' || name || ' SELECT * FROM importDb.' || name || ';'
                FROM sqlite_master
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%';";
            var tableInsertCommands = new List<string>();
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tableInsertCommands.Add(reader.GetString(0));
                }
            }

            foreach (var tableInsertCommand in tableInsertCommands)
            {
                command.CommandText = tableInsertCommand;
                await command.ExecuteNonQueryAsync();
            }

            command.CommandText = "DETACH DATABASE importDb";
            await command.ExecuteNonQueryAsync();
        }
        */

        using (var command = _sqlConnection.CreateCommand())
        {
            Console.WriteLine("Dropping main tables..");

            // Disable foreign key constraints
            command.CommandText = "PRAGMA foreign_keys = OFF;";
            await command.ExecuteNonQueryAsync();

            // Drop all tables in the original database
            command.CommandText = @"
                SELECT 'DROP TABLE IF EXISTS ' || name || ';'
                FROM sqlite_master
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%';";
            var dropTableCommands = new List<string>();
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dropTableCommands.Add(reader.GetString(0));
                }
            }

            foreach (var dropTableCommand in dropTableCommands)
            {
                Console.WriteLine("Dropping table..");
                Console.WriteLine("Drop command: " + dropTableCommand);
                command.CommandText = dropTableCommand;
                await command.ExecuteNonQueryAsync();
            }

            // Attach the imported database
            command.CommandText = "ATTACH DATABASE @fileName AS importDb";
            command.Parameters.Add(new SqliteParameter("@fileName", tempFileName));
            await command.ExecuteNonQueryAsync();

            Console.WriteLine("Make create table statements from import db..");

            // Get CREATE TABLE statements from the imported database
            command.CommandText = @"
                SELECT sql
                FROM importDb.sqlite_master
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%';";
            var createTableCommands = new List<string>();
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    createTableCommands.Add(reader.GetString(0));
                }
            }

            // Create tables in the main database
            Console.WriteLine("Create tables in main db..");

            foreach (var createTableCommand in createTableCommands)
            {
                command.CommandText = createTableCommand;
                await command.ExecuteNonQueryAsync();
            }

            // Copy data from imported database to main database
            Console.WriteLine("Copy from import to main db.");

            command.CommandText = @"
                SELECT 'INSERT INTO main.' || name || ' SELECT * FROM importDb.' || name || ';'
                FROM importDb.sqlite_master
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%';";
            var tableInsertCommands = new List<string>();
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tableInsertCommands.Add(reader.GetString(0));
                }
            }

            foreach (var tableInsertCommand in tableInsertCommands)
            {
                command.CommandText = tableInsertCommand;
                await command.ExecuteNonQueryAsync();
            }

            // Detach the imported database
            command.CommandText = "DETACH DATABASE importDb";
            await command.ExecuteNonQueryAsync();

            // Re-enable foreign key constraints
            command.CommandText = "PRAGMA foreign_keys = ON;";
            await command.ExecuteNonQueryAsync();
        }

        File.Delete(tempFileName);
    }

    /// <summary>
    /// Loads the database from the server.
    /// </summary>
    /// <returns>Task.</returns>
    private async Task<bool> LoadDatabaseFromServerAsync()
    {
        // Load from webapi.
        try
        {
            var vault = await _httpClient.GetFromJsonAsync<Vault>("api/v1/Vault");
            if (vault is not null)
            {
                // Check if vault blob is empty, if so, we don't need to do anything and the initial vault created
                // on client is sufficient.
                if (string.IsNullOrEmpty(vault.Blob))
                {
                    return true;
                }

                try
                {
                    // Attempt to decrypt the database blob.
                    string decryptedBase64String = await _jsRuntime.InvokeAsync<string>("cryptoInterop.decrypt", vault.Blob, _authService.GetEncryptionKeyAsBase64Async());
                    await ImportDbContextFromBase64Async(decryptedBase64String);
                }
                catch (Exception ex)
                {
                    // If decryption fails it can indicate that the master password hash is not correct anymore,
                    // so we logout the user just in case.
                    Console.WriteLine(ex.Message);
                    return false;
                }

                return true;
            }
        }
        catch
        {
            return false;
        }

        return false;
    }

    /// <summary>
    /// Save encrypted database blob to server.
    /// </summary>
    /// <param name="encryptedDatabase">Encrypted database as string.</param>
    /// <returns>True if save action succeeded.</returns>
    private async Task<bool> SaveToServerAsync(string encryptedDatabase)
    {
        var vaultObject = new Vault(encryptedDatabase, DateTime.Now, DateTime.Now);

        try
        {
            await _httpClient.PostAsJsonAsync("api/v1/Vault", vaultObject);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
