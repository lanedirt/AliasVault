//-----------------------------------------------------------------------
// <copyright file="VaultStatus.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.Enums;

/// <summary>
/// Enum representing the status of a vault during get/update operations.
/// </summary>
public enum VaultStatus
{
    /// <summary>
    /// The vault was retrieved or updated successfully.
    /// </summary>
    Ok = 0,

    /// <summary>
    /// A client-side merge is required before the vault can be retrieved or updated.
    /// </summary>
    MergeRequired = 1,

    /// <summary>
    /// The local vault is outdated and the client should fetch the latest vault from the server before saving can continue.
    /// </summary>
    Outdated = 2,
}
