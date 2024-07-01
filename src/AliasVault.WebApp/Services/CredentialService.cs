//-----------------------------------------------------------------------
// <copyright file="CredentialService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Services;

using System.Net.Http.Json;
using AliasClientDb;
using AliasVault.WebApp.Models;
using AliasVault.WebApp.Services.Database;
using Microsoft.EntityFrameworkCore;
using Identity = AliasGenerators.Identity.Models.Identity;

/// <summary>
/// Service class for alias operations.
/// </summary>
public class CredentialService(HttpClient httpClient, DbService dbService)
{
    /// <summary>
    /// Generate random identity by calling the IdentityGenerator API.
    /// </summary>
    /// <returns>Identity object.</returns>
    public async Task<Identity> GenerateRandomIdentityAsync()
    {
        var identity = await httpClient.GetFromJsonAsync<Identity>("api/v1/Identity/generate");
        if (identity is null)
        {
            throw new InvalidOperationException("Failed to generate random identity.");
        }

        return identity;
    }

    /// <summary>
    /// Insert new entry into database.
    /// </summary>
    /// <param name="loginObject">Login object to insert.</param>
    /// <returns>Guid of inserted entry.</returns>
    public async Task<Guid> InsertEntryAsync(Credential loginObject)
    {
        var context = await dbService.GetDbContextAsync();

        var login = new Credential
        {
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Username = loginObject.Alias.NickName ?? string.Empty, // TODO: refactor to have actual username in UI.
            Alias = new AliasClientDb.Alias()
            {
                NickName = loginObject.Alias.NickName,
                FirstName = loginObject.Alias.FirstName,
                LastName = loginObject.Alias.LastName,
                BirthDate = loginObject.Alias.BirthDate,
                Gender = loginObject.Alias.Gender,
                AddressStreet = loginObject.Alias.AddressStreet,
                AddressCity = loginObject.Alias.AddressCity,
                AddressState = loginObject.Alias.AddressState,
                AddressZipCode = loginObject.Alias.AddressZipCode,
                AddressCountry = loginObject.Alias.AddressCountry,
                Hobbies = loginObject.Alias.Hobbies,
                EmailPrefix = loginObject.Alias.EmailPrefix,
                PhoneMobile = loginObject.Alias.PhoneMobile,
                BankAccountIBAN = loginObject.Alias.BankAccountIBAN,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            Service = new AliasClientDb.Service()
            {
                Name = loginObject.Service.Name,
                Url = loginObject.Service.Url,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        login.Passwords.Add(new Password()
        {
            Value = loginObject.Passwords.First().Value,
        });

        await context.Credentials.AddAsync(login);

        await context.SaveChangesAsync();
        Console.WriteLine("Inserted new alias without password.");

        // Add password.
        login.Passwords.Add(loginObject.Passwords.First());

        await dbService.SaveDatabaseAsync();

        Console.WriteLine("Password added.");

        return login.Id;
    }

    /// <summary>
    /// Update an existing entry to database.
    /// </summary>
    /// <param name="loginObject">Login object to update.</param>
    /// <returns>Guid of updated entry.</returns>
    public async Task<Guid> UpdateEntryAsync(Credential loginObject)
    {
        var context = await dbService.GetDbContextAsync();

        // Get the existing entry.
        var login = await context.Credentials
            .Include(x => x.Alias)
            .Include(x => x.Service)
            .Include(x => x.Passwords)
            .Where(x => x.Id == loginObject.Id)
            .FirstAsync();

        login.UpdatedAt = DateTime.UtcNow;
        login.Alias.NickName = loginObject.Alias.NickName;
        login.Alias.FirstName = loginObject.Alias.FirstName;
        login.Alias.LastName = loginObject.Alias.LastName;
        login.Alias.BirthDate = loginObject.Alias.BirthDate;
        login.Alias.Gender = loginObject.Alias.Gender;
        login.Alias.AddressStreet = loginObject.Alias.AddressStreet;
        login.Alias.AddressCity = loginObject.Alias.AddressCity;
        login.Alias.AddressState = loginObject.Alias.AddressState;
        login.Alias.AddressZipCode = loginObject.Alias.AddressZipCode;
        login.Alias.AddressCountry = loginObject.Alias.AddressCountry;
        login.Alias.Hobbies = loginObject.Alias.Hobbies;
        login.Alias.EmailPrefix = loginObject.Alias.EmailPrefix;
        login.Alias.PhoneMobile = loginObject.Alias.PhoneMobile;
        login.Alias.BankAccountIBAN = loginObject.Alias.BankAccountIBAN;

        /* login.Passwords.First().Value = model.Password.Value;
           login.Passwords.First().UpdatedAt = DateTime.UtcNow;
        */

        login.Service.Name = loginObject.Service.Name;
        login.Service.Url = loginObject.Service.Url;
        login.Service.UpdatedAt = DateTime.UtcNow;

        await dbService.SaveDatabaseAsync();

        return login.Id;
    }

    /// <summary>
    /// Load existing entry from database.
    /// </summary>
    /// <param name="loginId">Id of login to load.</param>
    /// <returns>Alias object.</returns>
    public async Task<Credential?> LoadEntryAsync(Guid loginId)
    {
        var context = await dbService.GetDbContextAsync();

        var loginObject = await context.Credentials
        .Include(x => x.Passwords)
        .Include(x => x.Alias)
        .Include(x => x.Service)
        .Where(x => x.Id == loginId)
        .FirstOrDefaultAsync();

        return loginObject;
    }

    /// <summary>
    /// Get list with all login entries.
    /// </summary>
    /// <returns>List of CredentialListEntry objects.</returns>
    public async Task<List<CredentialListEntry>?> GetListAsync()
    {
        var context = await dbService.GetDbContextAsync();

        // Retrieve all aliases from client DB.
        return await context.Credentials
            .Include(x => x.Alias)
            .Include(x => x.Service)
            .Select(x => new CredentialListEntry
            {
                Id = x.Id,
                Logo = x.Service.Logo,
                Service = x.Service.Name ?? "n/a",
                CreateDate = x.CreatedAt,
            })
            .ToListAsync();
    }

    /// <summary>
    /// Removes existing entry from database.
    /// </summary>
    /// <param name="id">Id of alias to delete.</param>
    /// <returns>Task.</returns>
    public async Task DeleteEntryAsync(Guid id)
    {
        var context = await dbService.GetDbContextAsync();

        var login = await context.Credentials
            .Where(x => x.Id == id)
            .FirstAsync();

        context.Credentials.Remove(login);
        await context.SaveChangesAsync();
        await dbService.SaveDatabaseAsync();
    }
}
