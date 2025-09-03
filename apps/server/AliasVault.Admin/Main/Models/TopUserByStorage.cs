//-----------------------------------------------------------------------
// <copyright file="TopUserByStorage.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Models;

/// <summary>
/// Model representing a user with high storage usage.
/// </summary>
public class TopUserByStorage
{
    /// <summary>
    /// Gets or sets the user ID.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the storage size in bytes.
    /// </summary>
    public long StorageBytes { get; set; }

    /// <summary>
    /// Gets or sets the human-readable storage size.
    /// </summary>
    public string StorageDisplaySize { get; set; } = string.Empty;
}
