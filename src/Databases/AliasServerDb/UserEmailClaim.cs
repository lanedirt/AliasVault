//-----------------------------------------------------------------------
// <copyright file="UserEmailClaim.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasServerDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// UserEmailClaim object. This object is used to reserve an email address for a user.
/// </summary>
public class UserEmailClaim
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
    /// Gets or sets the full email address.
    /// </summary>
    [StringLength(255)]
    public string Address { get; set; } = null!;

    /// <summary>
    /// Gets or sets the email adress local part.
    /// </summary>
    [StringLength(255)]
    public string AddressLocal { get; set; } = null!;

    /// <summary>
    /// Gets or sets the email adress domain part.
    /// </summary>
    [StringLength(255)]
    public string AddressDomain { get; set; } = null!;

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
