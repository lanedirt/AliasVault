//-----------------------------------------------------------------------
// <copyright file="AliasClientDbService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Services;

using System.Data;
using System.Net.Http.Json;
using AliasClientDb;
using AliasVault.Shared.Models.WebApi;
using AliasVault.WebApp.Auth.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.JSInterop;

/// <summary>
/// Class to manage the in-memory AliasClientDb service. The reason for this service is to provide a way to interact
/// with a AliasClientDb database instance that is only persisted in memory due to the encryption requirements of the
/// database itself. The database should not be persisted to disk when in un-encrypted form.
/// </summary>
public class AliasClientDbService
{
    private readonly AuthService _authService;
    private readonly IJSRuntime _jsRuntime;
    private readonly HttpClient _httpClient;
    private readonly NavigationManager _navigationManager;
    private AliasClientDbContext? _dbContext;
    private Task _initializationTask;
    private bool _isSuccessfullyInitialized = false;
    private int _retryCount = 0;

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasClientDbService"/> class.
    /// </summary>
    /// <param name="authService">AuthService.</param>
    /// <param name="jsRuntime">IJSRuntime.</param>
    /// <param name="httpClient">HttpClient.</param>
    /// <param name="navigationManager">NavigationManager.</param>
    public AliasClientDbService(AuthService authService, IJSRuntime jsRuntime, HttpClient httpClient, NavigationManager navigationManager)
    {
        _authService = authService;
        _jsRuntime = jsRuntime;
        _httpClient = httpClient;
        _navigationManager = navigationManager;

        // Initialize the database asynchronously
        _initializationTask = InitializeDatabaseAsync();
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

        using var memoryStream = new MemoryStream();
        using var connection = new SqliteConnection(_dbContext!.Database.GetDbConnection().ConnectionString);
        await connection.OpenAsync();
        using var command = connection.CreateCommand();
        command.CommandText = "VACUUM main INTO @fileName";

        var tempFileName = Path.GetRandomFileName();
        command.Parameters.Add(new SqliteParameter("@fileName", tempFileName));
        await command.ExecuteNonQueryAsync();

        var bytes = await File.ReadAllBytesAsync(tempFileName);

        string base64String = Convert.ToBase64String(bytes);
        File.Delete(tempFileName);

        // Encrypt base64 string.
        // Encrypt using IJSInterop
        Console.WriteLine("Encrypted using key: " + _authService.GetEncryptionKeyAsBase64Async());
        string encryptedBase64String = await _jsRuntime.InvokeAsync<string>("cryptoInterop.encrypt", base64String, _authService.GetEncryptionKeyAsBase64Async());

        // Decrypt it again
        string decryptedBase64String = await _jsRuntime.InvokeAsync<string>("cryptoInterop.decrypt", encryptedBase64String, _authService.GetEncryptionKeyAsBase64Async());

        // Print original, encrypted and decrypted sting to console
        Console.WriteLine("Original: " + base64String);
        Console.WriteLine("Encrypted: " + encryptedBase64String);
        Console.WriteLine("Decrypted: " + decryptedBase64String);

        // Save to webapi.
        var success = await SaveToServerAsync(encryptedBase64String);
        if (success)
        {
            Console.WriteLine("Database succesfully saved to server.");
        }
        else
        {
            Console.WriteLine("Failed to save database to server.");
        }
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
            Console.WriteLine("Database succesfully loaded from server.");
        }
        else
        {
            Console.WriteLine("Failed to load database from server.");
        }
    }

    /// <summary>
    /// Loads the database from the server.
    /// </summary>
    /// <returns>Task.</returns>
    private async Task<bool> LoadDatabaseFromServerAsync()
    {
        // Sanity check: check that encryption key is set. If not, redirect to lock screen.
        if (string.IsNullOrEmpty(_authService.GetEncryptionKeyAsBase64Async()) ||
            _authService.GetEncryptionKeyAsBase64Async() == "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        {
            _navigationManager.NavigateTo("/unlock");
            return false;
        }

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
            await _httpClient.PostAsJsonAsync<Vault>("api/v1/Vault", vaultObject);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
