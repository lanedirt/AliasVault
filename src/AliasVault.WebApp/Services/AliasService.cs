using System.Net.Http.Json;
using AliasDb;
using AliasGenerators.Identity.Models;
using AliasVault.Shared.Models.WebApi;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using Microsoft.EntityFrameworkCore;

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
    /// Insert new entry into database.
    /// </summary>
    /// <param name="aliasObject"></param>
    public async Task<Login> InsertAliasAsync(Login aliasObject)
    {
        using (var dbContext = new AliasDbContext())
        {
            var newObject = aliasObject;
            newObject.Identity.CreatedAt = DateTime.UtcNow;
            newObject.Identity.UpdatedAt = DateTime.UtcNow;
            newObject.Passwords.First().CreatedAt = DateTime.UtcNow;
            newObject.Passwords.First().UpdatedAt = DateTime.UtcNow;
            newObject.CreatedAt = DateTime.UtcNow;
            newObject.UpdatedAt = DateTime.UtcNow;

            dbContext.Add(newObject);
            await dbContext.SaveChangesAsync();

            return newObject;
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
    public async Task<Login> LoadAliasAsync(Guid aliasId)
    {
        using (var dbContext = new AliasDbContext())
        {
            var aliasObject = await dbContext.Logins
                .Include(x => x.Passwords)
                .Include(x => x.Identity)
                .Include(x => x.Service)
                .Where(x => x.Id == aliasId)
                .FirstAsync();

            return aliasObject;
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
        catch (AccessTokenNotAvailableException ex)
        {
            ex.Redirect();
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
