//-----------------------------------------------------------------------
// <copyright file="VaultUpdateResponse.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Vault;

/// <summary>
/// Vault update response model.
/// </summary>
public class VaultUpdateResponse
{
    /// <summary>
    /// Gets or sets the current vault's revision number.
    /// The server will increment this number with each change to the vault and is used for managing concurrency
    /// and merging if conflicts are detected.
    /// </summary>
    public required long NewRevisionNumber { get; set; }
}
