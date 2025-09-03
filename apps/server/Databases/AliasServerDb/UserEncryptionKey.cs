//-----------------------------------------------------------------------
// <copyright file="UserEncryptionKey.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasServerDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// UserEncryptionKey object. This object is used for storing user public keys for encryption.
/// </summary>
public class UserEncryptionKey
{
    /// <summary>
    /// Gets or sets the ID.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets user ID foreign key.
    /// </summary>
    [StringLength(255)]
    public string UserId { get; set; } = null!;

    /// <summary>
    /// Gets or sets foreign key to the AliasVaultUser object.
    /// </summary>
    [ForeignKey("UserId")]
    public virtual AliasVaultUser User { get; set; } = null!;

    /// <summary>
    /// Gets or sets the public key.
    /// </summary>
    [StringLength(2000)]
    public string PublicKey { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether this public key is the primary key to use by default.
    /// </summary>
    public bool IsPrimary { get; set; }

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the collection of Emails that are using this encryption key.
    /// </summary>
    public virtual ICollection<Email> Emails { get; set; } = [];
}
