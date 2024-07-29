//-----------------------------------------------------------------------
// <copyright file="EncryptionKey.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// The EncryptionKey entity.
/// </summary>
public class EncryptionKey
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

    /// <summary>
    /// Gets or sets the created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
