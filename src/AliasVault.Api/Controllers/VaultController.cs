//-----------------------------------------------------------------------
// <copyright file="VaultController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using System.ComponentModel.DataAnnotations;
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
/// <param name="logger">ILogger instance.</param>
/// <param name="dbContextFactory">DbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="timeProvider">ITimeProvider instance.</param>
[ApiVersion("1")]
public class VaultController(ILogger<VaultController> logger, IDbContextFactory<AliasServerDbContext> dbContextFactory, UserManager<AliasVaultUser> userManager, ITimeProvider timeProvider) : AuthenticatedRequestController(userManager)
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
            return Ok(new Shared.Models.WebApi.Vault(string.Empty, string.Empty, string.Empty, new List<string>(), DateTime.MinValue, DateTime.MinValue));
        }

        return Ok(new Shared.Models.WebApi.Vault(vault.VaultBlob, vault.Version, string.Empty, new List<string>(), vault.CreatedAt, vault.UpdatedAt));
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

        // Sync user public key if supplied.
        if (!string.IsNullOrEmpty(model.EncryptionPublicKey))
        {
            await UpdateUserPublicKey(context, user.Id, model.EncryptionPublicKey);
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
            // If email address is invalid according to the EmailAddressAttribute, skip it.
            if (!new EmailAddressAttribute().IsValid(email))
            {
                continue;
            }

            // Check if the email address is already claimed (by another user).
            var existingClaim = await context.UserEmailClaims
                .FirstOrDefaultAsync(x => x.Address == email);

            if (existingClaim != null && existingClaim.UserId != userId)
            {
                // Email address is already claimed by another user. Log the error and continue.
                logger.LogWarning("{User} tried to claim email address: {Email} but it is already claimed by another user.", userId, email);
                continue;
            }

            if (!existingEmailClaims.Contains(email))
            {
                try
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
                catch (DbUpdateException ex)
                {
                    // Error while adding email claim. Log the error and continue.
                    logger.LogWarning(ex, "Error while adding UserEmailClaim with email: {Email} for user: {UserId}.", email, userId);
                }
            }
        }

        // Do not delete email claims that are not in the new list
        // as they may be re-used by the user in the future. We don't want
        // to allow other users to re-use emails used by other users.
        // Email claims are considered permanent.
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Updates the user's public key based on the provided public key. If it already exists, do nothing.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="userId">The ID of the user.</param>
    /// <param name="newPublicKey">The new public key to sync and set as default.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task UpdateUserPublicKey(AliasServerDbContext context, string userId, string newPublicKey)
    {
        // Get all existing user public keys.
        var publicKeyExists = await context.UserEncryptionKeys
            .AnyAsync(x => x.UserId == userId && x.IsPrimary && x.PublicKey == newPublicKey);

        // If the public key already exists and is marked as primary (default), do nothing.
        if (publicKeyExists)
        {
            return;
        }

        // Update all existing keys to not be primary.
        var otherKeys = await context.UserEncryptionKeys
            .Where(x => x.UserId == userId)
            .ToListAsync();

        foreach (var key in otherKeys)
        {
            key.IsPrimary = false;
            key.UpdatedAt = timeProvider.UtcNow;
        }

        // Check if the new public key already exists but is not marked as primary.
        var existingPublicKey = await context.UserEncryptionKeys
            .FirstOrDefaultAsync(x => x.UserId == userId && x.PublicKey == newPublicKey);

        if (existingPublicKey is not null)
        {
            // Set the existing key to be primary.
            existingPublicKey.IsPrimary = true;
            existingPublicKey.UpdatedAt = timeProvider.UtcNow;
            await context.SaveChangesAsync();
            return;
        }

        // Public key is new, so create it.
        var newPublicKeyEntry = new UserEncryptionKey
        {
            UserId = userId,
            PublicKey = newPublicKey,
            IsPrimary = true,
            CreatedAt = timeProvider.UtcNow,
            UpdatedAt = timeProvider.UtcNow,
        };
        context.UserEncryptionKeys.Add(newPublicKeyEntry);

        await context.SaveChangesAsync();
    }
}
