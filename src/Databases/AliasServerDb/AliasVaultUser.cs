//-----------------------------------------------------------------------
// <copyright file="AliasVaultUser.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.AspNetCore.Identity;

/// <summary>
/// Alias vault user extending IdentityUser with fields for SRP authentication.
/// </summary>
public class AliasVaultUser : IdentityUser
{
    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the user's password was last changed.
    /// </summary>
    public DateTime PasswordChangedAt { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the user is blocked and should not be able to log in.
    /// </summary>
    public bool Blocked { get; set; }

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
