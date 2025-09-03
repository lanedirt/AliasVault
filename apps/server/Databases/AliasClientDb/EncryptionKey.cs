//-----------------------------------------------------------------------
// <copyright file="EncryptionKey.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;
using AliasClientDb.Abstracts;

/// <summary>
/// The EncryptionKey entity.
/// </summary>
public class EncryptionKey : SyncableEntity
{
    /// <summary>
    /// Gets or sets the encryption key primary key.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the public key.
    /// </summary>
    [StringLength(2000)]
    public string PublicKey { get; set; } = null!;

    /// <summary>
    /// Gets or sets the private key.
    /// </summary>
    [StringLength(2000)]
    public string PrivateKey { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether this public/private key is the primary key to use by default.
    /// </summary>
    public bool IsPrimary { get; set; }
}
