//-----------------------------------------------------------------------
// <copyright file="AliasService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Services;

using System.Net.Http.Json;
using AliasVault.Shared.Models.WebApi;
using Identity = AliasGenerators.Identity.Models.Identity;

/// <summary>
/// Service class for alias operations.
/// </summary>
public class AliasService(HttpClient httpClient)
{
    /// <summary>
    /// Generate random identity by calling the IdentityGenerator API.
    /// </summary>
    /// <returns>Identity object.</returns>
    public async Task<Identity> GenerateRandomIdentityAsync()
    {
        var identity = await httpClient.GetFromJsonAsync<Identity>("api/Identity/generate");
        if (identity == null)
        {
            throw new InvalidOperationException("Failed to generate random identity.");
        }

        return identity;
    }

    /// <summary>
    /// Insert new entry into database.
    /// </summary>
    /// <param name="aliasObject">Alias object to insert.</param>
    /// <returns>Guid of inserted entry.</returns>
    public async Task<Guid> InsertAliasAsync(Alias aliasObject)
    {
        try
        {
            var returnObject = await httpClient.PutAsJsonAsync<Alias>("api/Alias", aliasObject);
            return await returnObject.Content.ReadFromJsonAsync<Guid>();
        }
        catch
        {
            return Guid.Empty;
        }
    }

    /// <summary>
    /// Update an existing entry to database.
    /// </summary>
    /// <param name="aliasObject">Alias object to update.</param>
    /// <param name="id">Id of alias to update.</param>
    /// <returns>Guid of updated entry.</returns>
    public async Task<Guid> UpdateAliasAsync(Alias aliasObject, Guid id)
    {
        try
        {
            var returnObject = await httpClient.PostAsJsonAsync<Alias>("api/Alias/" + id, aliasObject);
            return await returnObject.Content.ReadFromJsonAsync<Guid>();
        }
        catch
        {
            return Guid.Empty;
        }
    }

    /// <summary>
    /// Load existing entry from database.
    /// </summary>
    /// <param name="aliasId">Id of alias to load.</param>
    /// <returns>Alias object.</returns>
    public async Task<Alias?> LoadAliasAsync(Guid aliasId)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<Alias>("api/Alias/" + aliasId);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Get list with all entries that belong to current user.
    /// </summary>
    /// <returns>List of AliasListEntry objects.</returns>
    public async Task<List<AliasListEntry>?> GetListAsync()
    {
        try
        {
            return await httpClient.GetFromJsonAsync<List<AliasListEntry>>("api/Alias/items");
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Removes existing entry from database.
    /// </summary>
    /// <param name="id">Id of alias to delete.</param>
    /// <returns>Task.</returns>
    public async Task DeleteAliasAsync(Guid id)
    {
        // Delete from webapi.
        try
        {
            await httpClient.DeleteAsync("api/Alias/" + id);
        }
        catch
        {
            // If authentication failed, the AliasVaultApiHandlerService will redirect to login page.
        }
    }
}
