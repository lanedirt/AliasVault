//-----------------------------------------------------------------------
// <copyright file="VaultGetStatus.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.Enums;

/// <summary>
/// Enum representing the status of a vault get operation.
/// </summary>
public enum VaultGetStatus
{
    /// <summary>
    /// The vault was retrieved successfully.
    /// </summary>
    Ok,

    /// <summary>
    /// A client-side merge is required before the vault can be used.
    /// </summary>
    MergeRequired,
}
