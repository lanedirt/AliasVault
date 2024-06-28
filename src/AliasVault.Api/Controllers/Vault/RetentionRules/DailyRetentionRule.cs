//-----------------------------------------------------------------------
// <copyright file="DailyRetentionRule.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers.Vault.RetentionRules;

using AliasServerDb;

/// <summary>
/// Daily retention rule that keeps the latest vault for each day.
/// </summary>
public class DailyRetentionRule : IRetentionRule
{
    /// <summary>
    /// Gets or sets amount of days to keep vault.
    /// </summary>
    public int DaysToKeep { get; set; }

   /// <inheritdoc cref="IRetentionRule.ApplyRule"/>
    public IEnumerable<Vault> ApplyRule(List<Vault> vaults, DateTime now)
    {
        // For the specified amount of days, take last vault per day.
        return vaults
            .GroupBy(x => x.UpdatedAt.Date)
            .Select(g => g.OrderByDescending(x => x.UpdatedAt).First())
            .OrderByDescending(x => x.UpdatedAt)
            .Take(DaysToKeep);
    }
}
