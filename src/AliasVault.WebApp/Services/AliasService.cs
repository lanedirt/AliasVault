using System.Net.Http.Json;
using AliasDb;
using AliasGenerators.Identity.Models;
using AliasVault.Shared.Models.WebApi;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using Microsoft.EntityFrameworkCore;
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
    public async Task<Login> InsertAliasAsync(Login aliasObject)
    {
        // Post to webapi.
        try
        {
            var returnObject = await _httpClient.PostAsJsonAsync<Login>("api/Alias", aliasObject);
            return await returnObject.Content.ReadFromJsonAsync<Login>();
        }
        catch
        {
            // Return null if failed. If authentication failed, the AliasVaultApiHandlerService will redirect to login page.
            return null;
        }
    }

    /// <summary>
    /// Update an existing entry to database.
    /// </summary>
    /// <param name="aliasObject"></param>
    public async Task<Login> UpdateAliasAsync(Login aliasObject)
    {
        using (var dbContext = new AliasDbContext())
        {
            // Load existing record..
            var record = dbContext.Logins.First(x => x.Id == aliasObject.Id);

            // Update properties
            record.Identity.FirstName = aliasObject.Identity.FirstName;
            record.Identity.LastName = aliasObject.Identity.LastName;
            record.Identity.NickName = aliasObject.Identity.NickName;
            record.Identity.Gender = aliasObject.Identity.Gender;
            record.Identity.BirthDate = aliasObject.Identity.BirthDate;
            record.Identity.AddressStreet = aliasObject.Identity.AddressStreet;
            record.Identity.AddressCity = aliasObject.Identity.AddressCity;
            record.Identity.AddressState = aliasObject.Identity.AddressState;
            record.Identity.AddressZipCode = aliasObject.Identity.AddressZipCode;
            record.Identity.AddressCountry = aliasObject.Identity.AddressCountry;
            record.Identity.Hobbies = aliasObject.Identity.Hobbies;
            record.Identity.EmailPrefix = aliasObject.Identity.EmailPrefix;
            record.Identity.PhoneMobile = aliasObject.Identity.PhoneMobile;
            record.Identity.BankAccountIBAN = aliasObject.Identity.BankAccountIBAN;
            record.Identity.UpdatedAt = DateTime.UtcNow;

            // TODO: support multiple passwords.
            var password = record.Passwords.First();
            password.Value = aliasObject.Passwords.First().Value;
            password.UpdatedAt = DateTime.UtcNow;

            // Update service.
            record.Service.Name = aliasObject.Service.Name;
            record.Service.Url = aliasObject.Service.Url;
            record.Service.Logo = aliasObject.Service.Logo;
            record.Service.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync();

            return record;
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
    public async Task DeleteAliasAsync(Login alias)
    {
        using (var dbContext = new AliasDbContext())
        {
            dbContext.Logins.Remove(dbContext.Logins.First(x => x.Id == alias.Id));
            dbContext.SaveChanges();
        }
    }
}
