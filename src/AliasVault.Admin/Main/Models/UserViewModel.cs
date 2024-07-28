//-----------------------------------------------------------------------
// <copyright file="UserViewModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Models;

/// <summary>
/// User view model.
/// </summary>
public class UserViewModel
{
    /// <summary>
    /// Gets or sets the id.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the CreatedAt timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the user name.
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the vault count.
    /// </summary>
    public int VaultCount { get; set; }

    /// <summary>
    /// Gets or sets the total vault storage that this user takes up in kilobytes.
    /// </summary>
    public int VaultStorageInKb { get; set; }

    /// <summary>
    /// Gets or sets the last time the vault was updated.
    /// </summary>
    public DateTime LastVaultUpdate { get; set; }
}
