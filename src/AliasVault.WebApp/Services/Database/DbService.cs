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
using AliasVault.WebApp.Auth.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.JSInterop;

/// <summary>
/// Class to manage the in-memory AliasClientDb service. The reason for this service is to provide a way to interact
/// with a AliasClientDb database instance that is only persisted in memory due to the encryption requirements of the
/// database itself. The database should not be persisted to disk when in un-encrypted form.
/// </summary>
public class DbService
{
    private readonly AuthService _authService;
    private readonly IJSRuntime _jsRuntime;
    private readonly HttpClient _httpClient;
    private readonly DbServiceState _state = new();
    private AliasClientDbContext? _dbContext;
    private Task _initializationTask;
    private bool _isSuccessfullyInitialized;
    private int _retryCount;

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
        _state.UpdateState(DbServiceState.DatabaseStatus.Idle);

        // Initialize the database asynchronously
        _initializationTask = InitializeDatabaseAsync();
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
    /// Ensures that the service initialization is complete before proceeding.
    /// </summary>
    /// <returns>Task.</returns>
    public async Task EnsureInitializedAsync()
    {
        await _initializationTask;
    }

    /// <summary>
    /// Returns the AliasClientDbContext instance.
    /// </summary>
    /// <returns>AliasClientDbContext.</returns>
    public async Task<AliasClientDbContext> GetDbContextAsync()
    {
        await EnsureInitializedAsync();
        if (!_isSuccessfullyInitialized)
        {
            // Retry initialization up to 5 times before giving up.
            if (_retryCount < 5)
            {
                _retryCount++;
                _dbContext = null;
                _initializationTask = InitializeDatabaseAsync();
                await EnsureInitializedAsync();
            }
            else
            {
                throw new DataException("Failed to initialize database.");
            }
        }

        return _dbContext!;
    }

    /// <summary>
    /// Saves the database to the remote server.
    /// </summary>
    /// <returns>Task.</returns>
    public async Task SaveDatabaseAsync()
    {
        await EnsureInitializedAsync();

        // Set the initial state of the database service.
        _state.UpdateState(DbServiceState.DatabaseStatus.Saving);

        // Save the actual dbContext.
        await _dbContext!.SaveChangesAsync();

        string base64String = await ExportSqliteToBase64Async();

        // Encrypt base64 string using IJSInterop.
        string encryptedBase64String = await _jsRuntime.InvokeAsync<string>("cryptoInterop.encrypt", base64String, _authService.GetEncryptionKeyAsBase64Async());

        // Save to webapi.
        var success = await SaveToServerAsync(encryptedBase64String);
        if (success)
        {
            Console.WriteLine("Database succesfully saved to server.");
            _state.UpdateState(DbServiceState.DatabaseStatus.Idle);
        }
        else
        {
            Console.WriteLine("Failed to save database to server.");
            _state.UpdateState(DbServiceState.DatabaseStatus.Error);
        }
    }

    /// <summary>
    /// Export the in-memory SQLite database to a base64 string.
    /// </summary>
    /// <returns>Base64 encoded string that represents SQLite database.</returns>
    public async Task<string> ExportSqliteToBase64Async()
    {
        var tempFileName = Path.GetRandomFileName();

        // Export SQLite memory database to a temp file.
        using var memoryStream = new MemoryStream();
        using var connection = new SqliteConnection(_dbContext!.Database.GetDbConnection().ConnectionString);
        await connection.OpenAsync();
        using var command = connection.CreateCommand();
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

    private static async Task ImportDbContextFromBase64Async(AliasClientDbContext dbContext, string base64String)
    {
        var bytes = Convert.FromBase64String(base64String);
        var tempFileName = Path.GetRandomFileName();
        await File.WriteAllBytesAsync(tempFileName, bytes);

        using (var connection = new SqliteConnection(dbContext.Database.GetDbConnection().ConnectionString))
        {
            await connection.OpenAsync();
            using (var command = connection.CreateCommand())
            {
                // Drop all tables in the original database
                command.CommandText = @"
                    SELECT 'DELETE FROM ' || name || ';'
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
                    command.CommandText = dropTableCommand;
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
        }

        File.Delete(tempFileName);
    }

    private async Task InitializeDatabaseAsync()
    {
        // Check that encryption key is set. If not, do nothing.
        if (!_authService.IsEncryptionKeySet())
        {
            return;
        }

        _state.UpdateState(DbServiceState.DatabaseStatus.Loading);

        // Create a new in-memory database.
        string connectionString = "Data Source=AliasClientDb.sqlite";
        using var connection = new SqliteConnection(connectionString);
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AliasClientDbContext>()
            .UseSqlite(connection)
            .Options;

        _dbContext = new AliasClientDbContext(options);

        // Ensure the database is created.
        await _dbContext.Database.EnsureCreatedAsync();

        // Attempt to fill the local database with a previously saved database stored on the server.
        var loaded = await LoadDatabaseFromServerAsync();
        if (loaded)
        {
            _isSuccessfullyInitialized = true;
            _state.UpdateState(DbServiceState.DatabaseStatus.Idle);
            Console.WriteLine("Database succesfully loaded from server.");
        }
        else
        {
            _state.UpdateState(DbServiceState.DatabaseStatus.Error);
            Console.WriteLine("Failed to load database from server.");
        }
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
                    await ImportDbContextFromBase64Async(_dbContext!, decryptedBase64String);
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
