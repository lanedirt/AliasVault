//-----------------------------------------------------------------------
// <copyright file="RevisionNumberConflictRetentionRule.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Vault.RetentionRules;

using AliasServerDb;

/// <summary>
/// Revision number retention rule that keeps all vaults with the highest revision number.
/// This is crucial for handling potential optimistic concurrency conflicts.
/// </summary>
public class RevisionNumberConflictRetentionRule : IRetentionRule
{
    /// <inheritdoc cref="IRetentionRule.ApplyRule"/>
    public IEnumerable<Vault> ApplyRule(List<Vault> vaults, DateTime now)
    {
       var highestRevision = vaults.Max(v => v.RevisionNumber);
       return vaults.Where(v => v.RevisionNumber == highestRevision)
           .OrderByDescending(v => v.UpdatedAt);
    }
}
