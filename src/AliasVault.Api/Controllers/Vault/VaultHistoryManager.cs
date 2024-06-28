//-----------------------------------------------------------------------
// <copyright file="VaultHistoryManager.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers.Vault;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AliasServerDb;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// History manager for vaults that keeps track of vault history and applies retention rules to
/// determine how many vaults to keep as backups and automatically deletes vaults that do no
/// match the applied retention policies.
/// </summary>
public class VaultHistoryManager(DbContext context, RetentionPolicy retentionPolicy)
{
    /// <summary>
    /// Initializes a new instance of the <see cref="VaultHistoryManager"/> class.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="newVaultBlob">New encrypted vault blob as base64 string.</param>
    /// <returns>Async task.</returns>
    public async Task ManageVaultHistory(string userId, string newVaultBlob)
    {
        var now = DateTime.UtcNow;
        var existingVaults = await context.Set<AliasServerDb.Vault>()
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.UpdatedAt)
            .ToListAsync();

        var vaultsToKeep = new List<Vault>();
        var vaultsToDelete = new List<Vault>();

        // Process retention rules
        foreach (var rule in retentionPolicy.Rules)
        {
            var keptVaults = rule.ApplyRule(existingVaults, now);
            vaultsToKeep.AddRange(keptVaults);
            vaultsToDelete.AddRange(existingVaults.Except(keptVaults));
        }

        // Always keep the most recent vault
        if (existingVaults.Any() && !vaultsToKeep.Contains(existingVaults.First()))
        {
            vaultsToKeep.Add(existingVaults.First());
            vaultsToDelete.Remove(existingVaults.First());
        }

        // Create new vault entry
        var newVault = new AliasServerDb.Vault
        {
            UserId = userId,
            VaultBlob = newVaultBlob,
            CreatedAt = now,
            UpdatedAt = now,
        };

        context.Set<Vault>().Add(newVault);

        // Remove vaults marked for deletion
        context.Set<Vault>().RemoveRange(vaultsToDelete);

        await context.SaveChangesAsync();
    }
}
