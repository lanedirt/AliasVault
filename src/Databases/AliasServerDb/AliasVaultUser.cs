//-----------------------------------------------------------------------
// <copyright file="AliasVaultUser.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

/// <summary>
/// Alias vault user extending IdentityUser with fields for SRP authentication.
/// </summary>
public class AliasVaultUser : IdentityUser
{
    /// <summary>
    /// Gets or sets the salt used for SRP authentication.
    /// </summary>
    [StringLength(100)]
    public string Salt { get; set; } = null!;

    /// <summary>
    /// Gets or sets the verifier used for SRP authentication.
    /// </summary>
    [StringLength(1000)]
    public string Verifier { get; set; } = null!;

    /// <summary>
    /// Gets or sets the user public key to be used by server to encrypt information that server
    /// receives for user such as emails.
    /// </summary>
    [StringLength(2000)]
    public string PublicKey { get; set; } = null!;

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the collection of vaults.
    /// </summary>
    public virtual ICollection<Vault> Vaults { get; set; } = [];

    /// <summary>
    /// Gets or sets the collection of EmailClaims.
    /// </summary>
    public virtual ICollection<UserEmailClaim> EmailClaims { get; set; } = [];

    /// <summary>
    /// Gets or sets the collection of EncryptionKeys.
    /// </summary>
    public virtual ICollection<UserEncryptionKey> EncryptionKeys { get; set; } = [];
}
