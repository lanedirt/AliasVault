//-----------------------------------------------------------------------
// <copyright file="Vault.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
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
    public required string VaultBlob { get; set; }

    /// <summary>
    /// Gets or sets the vault data model version.
    /// </summary>
    [StringLength(255)]
    public required string Version { get; set; }

    /// <summary>
    /// Gets or sets the revision number of the vault.
    /// This number is incremented with each change to the vault and is used for
    /// managing concurrency and merging during the synchronization process.
    /// It helps in detecting conflicts and ensuring data consistency if multiple clients
    /// update a previous version of the vault simultaneously.
    /// </summary>
    [Required]
    public required long RevisionNumber { get; set; }

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
    public required string Salt { get; set; }

    /// <summary>
    /// Gets or sets the verifier used for SRP authentication. Note: the login credentials are stored with the vault
    /// because the vault itself is encrypted with the same key derived from the user's password. So the password the
    /// user uses to log in to AliasVault needs to be the same as the vault to keep everything in-sync in case of vault
    /// backup restores.
    /// </summary>
    [StringLength(1000)]
    public required string Verifier { get; set; }

    /// <summary>
    /// Gets or sets the number of credentials stored in the vault. This anonymous data is used in case a vault back-up
    /// needs to be restored to get a better idea of the vault size.
    /// </summary>
    public int CredentialsCount { get; set; }

    /// <summary>
    /// Gets or sets the number of email claims stored in the vault. This anonymous data is used in case a vault back-up
    /// needs to be restored to get a better idea of the vault size.
    /// </summary>
    public int EmailClaimsCount { get; set; }

    /// <summary>
    /// Gets or sets the encryption type.
    /// </summary>
    public required string EncryptionType { get; set; }

    /// <summary>
    /// Gets or sets the encryption settings as a JSON string.
    /// </summary>
    public required string EncryptionSettings { get; set; }

    /// <summary>
    /// Gets or sets the client that created the vault.
    /// </summary>
    [StringLength(255)]
    public string? Client { get; set; }

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
