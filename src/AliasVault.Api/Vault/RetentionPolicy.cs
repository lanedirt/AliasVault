//-----------------------------------------------------------------------
// <copyright file="RetentionPolicy.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Vault;

using AliasVault.Api.Vault.RetentionRules;

/// <summary>
/// The retention policy that contains one or more retention rules.
/// </summary>
public class RetentionPolicy
{
    /// <summary>
    /// Gets or sets the rules that this policy consists of.
    /// </summary>
    public List<IRetentionRule> Rules { get; set; } = new();
}
