//-----------------------------------------------------------------------
// <copyright file="VaultMergeResponse.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Vault;

/// <summary>
/// Vault merge response model.
/// </summary>
public class VaultMergeResponse
{
    /// <summary>
    /// Gets or sets the list of vaults that are to be merged.
    /// </summary>
    public List<Vault> Vaults { get; set; } = new();
}
