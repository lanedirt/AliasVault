//-----------------------------------------------------------------------
// <copyright file="VaultController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasServerDb;
using AliasVault.Api.Vault;
using AliasVault.Api.Vault.RetentionRules;
using AliasVault.Shared.Providers.Time;
using Asp.Versioning;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Vault controller for handling CRUD operations on the database for encrypted vault entities.
/// </summary>
/// <param name="context">DbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="timeProvider">ITimeProvider instance.</param>
[ApiVersion("1")]
public class VaultController(AliasServerDbContext context, UserManager<AliasVaultUser> userManager, ITimeProvider timeProvider) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Default retention policy for vaults.
    /// </summary>
    private readonly RetentionPolicy _retentionPolicy = new()
    {
        Rules = new List<IRetentionRule>
        {
            new DailyRetentionRule { DaysToKeep = 3 },
            new WeeklyRetentionRule { WeeksToKeep = 1 },
            new MonthlyRetentionRule { MonthsToKeep = 1 },
            new VersionRetentionRule { VersionsToKeep = 3 },
        },
    };

    /// <summary>
    /// Get the newest version of the vault for the current user.
    /// </summary>
    /// <returns>List of aliases in JSON format.</returns>
    [HttpGet("")]
    public async Task<IActionResult> GetVault()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        // Logic to retrieve vault for the user.
        var vault = await context.Vaults
            .Where(x => x.UserId == user.Id)
            .OrderByDescending(x => x.UpdatedAt)
            .FirstOrDefaultAsync();

        // If no vault is found on server, return an empty object. This means the client will use an empty vault
        // as starting point.
        if (vault == null)
        {
            return Ok(new Shared.Models.WebApi.Vault(string.Empty, string.Empty, DateTime.MinValue, DateTime.MinValue));
        }

        return Ok(new Shared.Models.WebApi.Vault(vault.VaultBlob, vault.Version, vault.CreatedAt, vault.UpdatedAt));
    }

    /// <summary>
    /// Save a new vault to the database for the current user.
    /// </summary>
    /// <param name="model">Vault model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("")]
    public async Task<IActionResult> Update([FromBody] Shared.Models.WebApi.Vault model)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        // Create new vault entry.
        var newVault = new AliasServerDb.Vault
        {
            UserId = user.Id,
            VaultBlob = model.Blob,
            Version = model.Version,
            CreatedAt = timeProvider.UtcNow,
            UpdatedAt = timeProvider.UtcNow,
        };

        // Run the vault retention manager to keep the required vaults according
        // to the applied retention policies and delete the rest.
        // We only select the Id and UpdatedAt fields to reduce the amount of data transferred from the database.
        var existingVaults = await context.Vaults
            .Where(x => x.UserId == user.Id)
            .OrderByDescending(v => v.UpdatedAt)
            .Select(x => new AliasServerDb.Vault { Id = x.Id, UpdatedAt = x.UpdatedAt })
            .ToListAsync();

        var vaultsToDelete = VaultRetentionManager.ApplyRetention(_retentionPolicy, existingVaults, timeProvider.UtcNow, newVault);

        // Delete vaults that are not needed anymore.
        context.Vaults.RemoveRange(vaultsToDelete);

        // Add the new vault and commit to database.
        await context.Vaults.AddAsync(newVault);
        await context.SaveChangesAsync();

        return Ok();
    }
}
