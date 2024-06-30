//-----------------------------------------------------------------------
// <copyright file="Attachment.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// Attachment entity.
/// </summary>
public class Attachment
{
    /// <summary>
    /// Gets or sets the attachment primary key.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the filename value.
    /// </summary>
    [StringLength(255)]
    public string Filename { get; set; } = null!;

    /// <summary>
    /// Gets or sets the file blob.
    /// </summary>
    public byte[] Blob { get; set; } = null!;

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
