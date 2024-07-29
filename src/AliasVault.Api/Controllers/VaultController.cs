//-----------------------------------------------------------------------
// <copyright file="VaultController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasServerDb;
using AliasVault.Api.Helpers;
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
/// <param name="dbContextFactory">DbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="timeProvider">ITimeProvider instance.</param>
[ApiVersion("1")]
public class VaultController(IDbContextFactory<AliasServerDbContext> dbContextFactory, UserManager<AliasVaultUser> userManager, ITimeProvider timeProvider) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Default retention policy for vaults.
    /// </summary>
    private readonly RetentionPolicy _retentionPolicy = new()
    {
        Rules =
        [
            new DailyRetentionRule { DaysToKeep = 3 },
            new WeeklyRetentionRule { WeeksToKeep = 1 },
            new MonthlyRetentionRule { MonthsToKeep = 1 },
            new VersionRetentionRule { VersionsToKeep = 3 },
        ],
    };

    /// <summary>
    /// Get the newest version of the vault for the current user.
    /// </summary>
    /// <returns>List of aliases in JSON format.</returns>
    [HttpGet("")]
    public async Task<IActionResult> GetVault()
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

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
            return Ok(new Shared.Models.WebApi.Vault(string.Empty, string.Empty, new List<string>(), DateTime.MinValue, DateTime.MinValue));
        }

        return Ok(new Shared.Models.WebApi.Vault(vault.VaultBlob, vault.Version, new List<string>(), vault.CreatedAt, vault.UpdatedAt));
    }

    /// <summary>
    /// Save a new vault to the database for the current user.
    /// </summary>
    /// <param name="model">Vault model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("")]
    public async Task<IActionResult> Update([FromBody] Shared.Models.WebApi.Vault model)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        // Create new vault entry.
        var newVault = new Vault
        {
            UserId = user.Id,
            VaultBlob = model.Blob,
            Version = model.Version,
            FileSize = FileHelper.Base64StringToKilobytes(model.Blob),
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

        // Update user email claims if email addresses have been supplied.
        if (model.EmailAddressList.Count > 0)
        {
            await UpdateUserEmailClaims(context, user.Id, model.EmailAddressList);
        }

        return Ok();
    }

    /// <summary>
    /// Updates the user's email claims based on the provided email address list.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="userId">The ID of the user.</param>
    /// <param name="newEmailAddresses">The list of new email addresses to claim.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task UpdateUserEmailClaims(AliasServerDbContext context, string userId, List<string> newEmailAddresses)
    {
        // Get all existing user email claims.
        var existingEmailClaims = await context.UserEmailClaims
            .Where(x => x.UserId == userId)
            .Select(x => x.Address)
            .ToListAsync();

        // Register new email addresses.
        foreach (var email in newEmailAddresses)
        {
            if (!existingEmailClaims.Contains(email))
            {
                await context.UserEmailClaims.AddAsync(new UserEmailClaim
                {
                    UserId = userId,
                    Address = email,
                    AddressLocal = email.Split('@')[0],
                    AddressDomain = email.Split('@')[1],
                    CreatedAt = timeProvider.UtcNow,
                    UpdatedAt = timeProvider.UtcNow,
                });
            }
        }

        // Do not delete email claims that are not in the new list
        // as they may be re-used by the user in the future. We don't want
        // to allow other users to re-use emails used by other users.
        // Email claims are considered permanent.
        await context.SaveChangesAsync();
    }
}
