//-----------------------------------------------------------------------
// <copyright file="Password.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasServerDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// Password entity.
/// </summary>
public class Password
{
    /// <summary>
    /// Gets or sets the password primary key.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the password value.
    /// </summary>
    [StringLength(255)]
    public string? Value { get; set; }

    /// <summary>
    /// Gets or sets the created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the login foreign key.
    /// </summary>
    public Guid LoginId { get; set; }

    /// <summary>
    /// Gets or sets the login navigation property.
    /// </summary>
    [ForeignKey("LoginId")]
    public virtual Login Login { get; set; } = null!;
}
