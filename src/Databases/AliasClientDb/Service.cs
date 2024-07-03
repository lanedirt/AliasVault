//-----------------------------------------------------------------------
// <copyright file="Service.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// The service entity.
/// </summary>
public class Service
{
    /// <summary>
    /// Gets or sets the service primary key.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the service name.
    /// </summary>
    [StringLength(255)]
    public string? Name { get; set; }

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    [StringLength(255)]
    public string? Url { get; set; }

    /// <summary>
    /// Gets or sets image logo of the service.
    /// </summary>
    public byte[]? Logo { get; set; } = null;

    /// <summary>
    /// Gets or sets the created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the credential objects.
    /// </summary>
    public virtual ICollection<Credential> Credentials { get; set; } = [];
}
