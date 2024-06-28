//-----------------------------------------------------------------------
// <copyright file="IRetentionRule.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers.Vault;

using AliasServerDb;

/// <summary>
/// Retention rule interface that specify the contract for all retention rules.
/// </summary>
public interface IRetentionRule
{
    /// <summary>
    /// Apply retention rule.
    /// </summary>
    /// <param name="vaults">List of existing vaults to apply the retention rule to.</param>
    /// <param name="now">Current DateTime.</param>
    /// <returns>Vaults that should be kept according to the retention rule.</returns>
    IEnumerable<Vault> ApplyRule(List<Vault> vaults, DateTime now);
}
