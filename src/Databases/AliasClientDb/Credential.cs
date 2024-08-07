//-----------------------------------------------------------------------
// <copyright file="Credential.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// Login object.
/// </summary>
public class Credential
{
    /// <summary>
    /// Gets or sets Login ID.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the identity ID foreign key.
    /// </summary>
    public Guid AliasId { get; set; }

    /// <summary>
    /// Gets or sets the identity object.
    /// </summary>
    [ForeignKey("AliasId")]
    public virtual Alias Alias { get; set; } = null!;

    /// <summary>
    /// Gets or sets optional notes field.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets the username field.
    /// </summary>
    public string Username { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password objects.
    /// </summary>
    public virtual ICollection<Password> Passwords { get; set; } = [];

    /// <summary>
    /// Gets or sets the attachment objects.
    /// </summary>
    public virtual ICollection<Attachment> Attachments { get; set; } = [];

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the service ID foreign key.
    /// </summary>
    public Guid ServiceId { get; set; }

    /// <summary>
    /// Gets or sets the service object.
    /// </summary>
    [ForeignKey("ServiceId")]
    public virtual Service Service { get; set; } = null!;
}
