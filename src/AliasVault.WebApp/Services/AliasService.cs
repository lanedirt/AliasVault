using System.Net.Http.Json;
using AliasDb;
using AliasVault.Shared.Models.WebApi;
using Identity = AliasGenerators.Identity.Models.Identity;

namespace AliasVault.WebApp.Services;

public class AliasService
{
    private HttpClient _httpClient;

    /// <summary>
    /// Public constructor which can be called from static async method or directly.
    /// </summary>
    /// <param name="aliasObj"></param>
    /// <param name="httpClient"></param>
    public AliasService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    /// <summary>
    /// Generate random identity by calling the IdentityGenerator API.
    /// </summary>
    /// <returns></returns>
    public async Task<Identity> GenerateRandomIdentityAsync()
    {
        return await _httpClient.GetFromJsonAsync<Identity>("api/Identity/generate");
    }

    /// <summary>
    /// Insert new entry into database.
    /// </summary>
    /// <param name="aliasObject"></param>
    public async Task<Guid> InsertAliasAsync(Alias aliasObject)
    {
        // Put to webapi.
        try
        {
            var returnObject = await _httpClient.PutAsJsonAsync<Alias>("api/Alias", aliasObject);
            return await returnObject.Content.ReadFromJsonAsync<Guid>();
        }
        catch
        {
            // Return null if failed. If authentication failed, the AliasVaultApiHandlerService will redirect to login page.
            return Guid.Empty;
        }
    }

    /// <summary>
    /// Update an existing entry to database.
    /// </summary>
    /// <param name="aliasObject"></param>
    /// <param name="id"></param>
    public async Task<Guid> UpdateAliasAsync(Alias aliasObject, Guid id)
    {
        // Post to webapi.
        try
        {
            var returnObject = await _httpClient.PostAsJsonAsync<Alias>("api/Alias/" + id, aliasObject);
            return await returnObject.Content.ReadFromJsonAsync<Guid>();
        }
        catch
        {
            // Return null if failed. If authentication failed, the AliasVaultApiHandlerService will redirect to login page.
            return Guid.Empty;
        }
    }

    /// <summary>
    /// Load existing entry from database.
    /// </summary>
    /// <param name="aliasId"></param>
    public async Task<Alias?> LoadAliasAsync(Guid aliasId)
    {
        // Make webapi call to get list of all entries.
        try
        {
            return await _httpClient.GetFromJsonAsync<Alias>("api/Alias/" + aliasId);
        }
        catch
        {
            // Return null if failed. If authentication failed, the AliasVaultApiHandlerService will redirect to login page.
            return null;
        }
    }

    /// <summary>
    /// Get list with all entries from database.
    /// </summary>
    public async Task<List<AliasListEntry>?> GetListAsync()
    {
        // Make webapi call to get list of all entries.
        try
        {
            return await _httpClient.GetFromJsonAsync<List<AliasListEntry>>("api/Alias/items");
        }
        catch
        {
            // Return null if failed. If authentication failed, the AliasVaultApiHandlerService will redirect to login page.
            return null;
        }
    }

    /// <summary>
    /// Removes existing entry from database.
    /// </summary>
    /// <param name="alias"></param>
    public async Task DeleteAliasAsync(Guid Id)
    {
        // Delete from webapi.
        try
        {
            await _httpClient.DeleteAsync("api/Alias/" + Id);
        }
        catch
        {
            // If authentication failed, the AliasVaultApiHandlerService will redirect to login page.
        }
    }
}
