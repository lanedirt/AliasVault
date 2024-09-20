//-----------------------------------------------------------------------
// <copyright file="CredentialService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using AliasClientDb;
using AliasGenerators.Identity.Implementations;
using AliasGenerators.Identity.Models;
using AliasGenerators.Password.Implementations;
using AliasVault.Shared.Models.WebApi.Favicon;
using Microsoft.EntityFrameworkCore;
using Identity = AliasGenerators.Identity.Models.Identity;

/// <summary>
/// Service class for alias operations.
/// </summary>
public sealed class CredentialService(HttpClient httpClient, DbService dbService, Config config)
{
    /// <summary>
    /// The default service URL used as placeholder in forms. When this value is set, the URL field is considered empty
    /// and a null value is stored in the database.
    /// </summary>
    public const string DefaultServiceUrl = "https://";

    /// <summary>
    /// Generates a random password for a credential.
    /// </summary>
    /// <returns>Random password.</returns>
    public static string GenerateRandomPassword()
    {
        // Generate a random password using a IPasswordGenerator implementation.
        var passwordGenerator = new SpamOkPasswordGenerator();
        return passwordGenerator.GenerateRandomPassword();
    }

    /// <summary>
    /// Generates a random identity for a credential.
    /// </summary>
    /// <param name="credential">The credential object to update.</param>
    /// <returns>Task.</returns>
    public async Task<Credential> GenerateRandomIdentity(Credential credential)
    {
        // Generate a random identity using the IIdentityGenerator implementation.
        var identity = await IdentityGeneratorFactory.CreateIdentityGenerator(dbService.Settings.DefaultIdentityLanguage).GenerateRandomIdentityAsync();

        // Generate random values for the Identity properties
        credential.Username = identity.NickName;
        credential.Alias.FirstName = identity.FirstName;
        credential.Alias.LastName = identity.LastName;
        credential.Alias.NickName = identity.NickName;
        credential.Alias.Gender = identity.Gender == Gender.Male ? "Male" : "Female";
        credential.Alias.BirthDate = identity.BirthDate;

        // Set the email
        var emailDomain = GetDefaultEmailDomain();
        credential.Alias.Email = $"{identity.EmailPrefix}@{emailDomain}";

        // Generate password
        credential.Passwords.First().Value = GenerateRandomPassword();

        return credential;
    }

    /// <summary>
    /// Gets the default email domain based on settings and available domains.
    /// </summary>
    /// <returns>Default email domain.</returns>
    public string GetDefaultEmailDomain()
    {
        var defaultDomain = dbService.Settings.DefaultEmailDomain;

        // Function to check if a domain is valid
        bool IsValidDomain(string domain) =>
            !string.IsNullOrEmpty(domain) &&
            domain != "DISABLED.TLD" &&
            (config.PublicEmailDomains.Contains(domain) || config.PrivateEmailDomains.Contains(domain));

        // Get the first valid domain from private or public domains
        string GetFirstValidDomain() =>
            config.PrivateEmailDomains.Find(IsValidDomain) ??
            config.PublicEmailDomains.FirstOrDefault() ??
            "example.com";

        // Use the default domain if it's valid, otherwise get the first valid domain
        string domainToUse = IsValidDomain(defaultDomain) ? defaultDomain : GetFirstValidDomain();

        return domainToUse;
    }

    /// <summary>
    /// Insert new entry into database.
    /// </summary>
    /// <param name="loginObject">Login object to insert.</param>
    /// <param name="saveToDb">Whether to commit changes to database. Defaults to true, but can be set to false if entries are added in bulk by caller.</param>
    /// <returns>Guid of inserted entry.</returns>
    public async Task<Guid> InsertEntryAsync(Credential loginObject, bool saveToDb = true)
    {
        var context = await dbService.GetDbContextAsync();

        // Try to extract favicon from service URL
        await ExtractFaviconAsync(loginObject);

        // If the email starts with an @ it is most likely still the placeholder which hasn't been filled.
        // So we remove it.
        if (loginObject.Alias.Email is not null && loginObject.Alias.Email.StartsWith('@'))
        {
            loginObject.Alias.Email = null;
        }

        // If the URL equals the placeholder, we set it to null.
        if (loginObject.Service.Url == DefaultServiceUrl)
        {
            loginObject.Service.Url = null;
        }

        var login = new Credential
        {
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Notes = loginObject.Notes,
            Username = loginObject.Username,
            Alias = new Alias()
            {
                NickName = loginObject.Alias.NickName,
                FirstName = loginObject.Alias.FirstName,
                LastName = loginObject.Alias.LastName,
                BirthDate = loginObject.Alias.BirthDate,
                Gender = loginObject.Alias.Gender,
                Email = loginObject.Alias.Email,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            Service = new Service()
            {
                Name = loginObject.Service.Name,
                Url = loginObject.Service.Url,
                Logo = loginObject.Service.Logo,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        login.Passwords.Add(new Password()
        {
            Value = loginObject.Passwords.First().Value,
        });

        foreach (var attachment in loginObject.Attachments)
        {
            login.Attachments.Add(attachment);
        }

        context.Credentials.Add(login);

        // Add password.
        login.Passwords.Add(loginObject.Passwords.First());

        if (saveToDb)
        {
            await dbService.SaveDatabaseAsync();
        }

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

        // Try to extract favicon from service URL
        await ExtractFaviconAsync(loginObject);

        // Get the existing entry.
        var login = await LoadEntryAsync(loginObject.Id);
        if (login is null)
        {
            throw new InvalidOperationException("Login object not found.");
        }

        // If the email starts with an @ it is most likely still the placeholder which hasn't been filled.
        // So we remove it.
        if (loginObject.Alias.Email is not null && loginObject.Alias.Email.StartsWith('@'))
        {
            loginObject.Alias.Email = null;
        }

        // If the URL equals the placeholder, we set it to null.
        if (loginObject.Service.Url == DefaultServiceUrl)
        {
            loginObject.Service.Url = null;
        }

        login.UpdatedAt = DateTime.UtcNow;
        login.Notes = loginObject.Notes;
        login.Username = loginObject.Username;

        login.Alias.NickName = loginObject.Alias.NickName;
        login.Alias.FirstName = loginObject.Alias.FirstName;
        login.Alias.LastName = loginObject.Alias.LastName;
        login.Alias.BirthDate = loginObject.Alias.BirthDate;
        login.Alias.Gender = loginObject.Alias.Gender;
        login.Alias.Email = loginObject.Alias.Email;
        login.Alias.UpdatedAt = DateTime.UtcNow;

        login.Passwords = loginObject.Passwords;
        if (login.Passwords.Count > 0)
        {
            login.Passwords.First().UpdatedAt = DateTime.UtcNow;
        }

        login.Service.Name = loginObject.Service.Name;
        login.Service.Url = loginObject.Service.Url;
        login.Service.Logo = loginObject.Service.Logo;
        login.Service.UpdatedAt = DateTime.UtcNow;

        // Remove attachments that are no longer in the list
        var existingAttachments = login.Attachments.ToList();
        foreach (var existingAttachment in existingAttachments)
        {
            if (!loginObject.Attachments.Any(a => a.Id != Guid.Empty && a.Id == existingAttachment.Id))
            {
                context.Entry(existingAttachment).State = EntityState.Deleted;
            }
        }

        // Add new attachments
        foreach (var attachment in loginObject.Attachments)
        {
            if (!login.Attachments.Any(a => attachment.Id != Guid.Empty && a.Id == attachment.Id))
            {
                login.Attachments.Add(attachment);
            }
            else
            {
                context.Entry(attachment).State = EntityState.Modified;
            }
        }

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
        .Include(x => x.Attachments)
        .AsSplitQuery()
        .Where(x => x.Id == loginId)
        .Where(x => !x.IsDeleted)
        .FirstOrDefaultAsync();

        return loginObject;
    }

    /// <summary>
    /// Load all entries from database.
    /// </summary>
    /// <returns>Alias object.</returns>
    public async Task<List<Credential>> LoadAllAsync()
    {
        var context = await dbService.GetDbContextAsync();

        var loginObject = await context.Credentials
        .Include(x => x.Passwords)
        .Include(x => x.Alias)
        .Include(x => x.Service)
        .Include(x => x.Attachments)
        .AsSplitQuery()
        .Where(x => !x.IsDeleted)
        .ToListAsync();

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
            .AsSplitQuery()
            .Where(x => !x.IsDeleted)
            .Select(x => new CredentialListEntry
            {
                Id = x.Id,
                Logo = x.Service.Logo,
                Service = x.Service.Name,
                CreateDate = x.CreatedAt,
            })
            .ToListAsync();
    }

    /// <summary>
    /// Soft deletes an existing entry from database. NOTE: all user actions should be handled via this soft deletion.
    /// Permanently deleting entries is handled by periodic database cleanup job. The soft-delete mechanism
    /// is required in order to synchronize the deletion of entries across multiple client vault versions.
    /// </summary>
    /// <param name="id">Id of alias to delete.</param>
    /// <returns>Task.</returns>
    public async Task SoftDeleteEntryAsync(Guid id)
    {
        var context = await dbService.GetDbContextAsync();

        var login = await context.Credentials
            .Where(x => x.Id == id)
            .FirstAsync();

        login.IsDeleted = true;
        login.UpdatedAt = DateTime.UtcNow;

        // Mark associated alias and service as deleted
        var alias = await context.Aliases
            .Where(x => x.Id == login.Alias.Id)
            .FirstAsync();
        alias.IsDeleted = true;
        alias.UpdatedAt = DateTime.UtcNow;

        var service = await context.Services
            .Where(x => x.Id == login.Service.Id)
            .FirstAsync();
        service.IsDeleted = true;
        service.UpdatedAt = DateTime.UtcNow;

        await dbService.SaveDatabaseAsync();
    }

    /// <summary>
    /// Extract favicon from service URL if available in object. If successful the passed object itself will be updated with the bytes.
    /// </summary>
    /// <param name="credentialObject">The Credential object to extract the favicon for.</param>
    /// <returns>Task.</returns>
    private async Task ExtractFaviconAsync(Credential credentialObject)
    {
        // Try to extract favicon from service URL
        var url = credentialObject.Service.Url;
        if (url != null && !string.IsNullOrEmpty(url) && url.Contains("http"))
        {
            // Request favicon from from service URL via WebApi
            try
            {
                var apiReturn =
                    await httpClient.GetFromJsonAsync<FaviconExtractModel>($"api/v1/Favicon/Extract?url={url}");
                if (apiReturn != null && apiReturn.Image != null)
                {
                    credentialObject.Service.Logo = apiReturn.Image;
                }
            }
            catch
            {
                // Ignore favicon extraction errors
            }
        }
    }
}
