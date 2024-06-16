//-----------------------------------------------------------------------
// <copyright file="Login.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

/// <summary>
/// Login object.
/// </summary>
public class Login
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
    /// Gets or sets foreign key to the IdentityUser object.
    /// </summary>
    [ForeignKey("UserId")]
    public virtual IdentityUser User { get; set; } = null!;

    /// <summary>
    /// Gets or sets optional login description.
    /// </summary>
    [StringLength(255)]
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the identity ID foreign key.
    /// </summary>
    public Guid IdentityId { get; set; }

    /// <summary>
    /// Gets or sets the identity object.
    /// </summary>
    [ForeignKey("IdentityId")]
    public virtual Identity Identity { get; set; } = null!;

    /// <summary>
    /// Gets or sets the service ID foreign key.
    /// </summary>
    public Guid ServiceId { get; set; }

    /// <summary>
    /// Gets or sets the service object.
    /// </summary>
    [ForeignKey("ServiceId")]
    public virtual Service Service { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password objects.
    /// </summary>
    public virtual ICollection<Password> Passwords { get; set; } = new List<Password>();
}
