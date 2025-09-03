//-----------------------------------------------------------------------
// <copyright file="Service.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;
using AliasClientDb.Abstracts;

/// <summary>
/// The service entity.
/// </summary>
public class Service : SyncableEntity
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
    /// Gets or sets the credential objects.
    /// </summary>
    public virtual ICollection<Credential> Credentials { get; set; } = [];
}
