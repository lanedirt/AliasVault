//-----------------------------------------------------------------------
// <copyright file="Vault.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasServerDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// Vault object.
/// </summary>
public class Vault
{
    /// <summary>
    /// Gets or sets Login ID.
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
    /// Gets or sets the encrypted vault blob.
    /// </summary>
    public string VaultBlob { get; set; } = null!;

    /// <summary>
    /// Gets or sets the vault data model version.
    /// </summary>
    [StringLength(255)]
    public string Version { get; set; } = null!;

    /// <summary>
    /// Gets or sets the vault filesize in kilobytes.
    /// </summary>
    public int FileSize { get; set; }

    /// <summary>
    /// Gets or sets the salt used for SRP authentication. Note: the login credentials are stored with the vault because
    /// the vault itself is encrypted with the same key derived from the user's password. So the password the user
    /// uses to log in to AliasVault needs to be the same as the vault to keep everything in-sync in case of vault
    /// backup restores.
    /// </summary>
    [StringLength(100)]
    public string Salt { get; set; } = null!;

    /// <summary>
    /// Gets or sets the verifier used for SRP authentication. Note: the login credentials are stored with the vault
    /// because the vault itself is encrypted with the same key derived from the user's password. So the password the
    /// user uses to log in to AliasVault needs to be the same as the vault to keep everything in-sync in case of vault
    /// backup restores.
    /// </summary>
    [StringLength(1000)]
    public string Verifier { get; set; } = null!;

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
