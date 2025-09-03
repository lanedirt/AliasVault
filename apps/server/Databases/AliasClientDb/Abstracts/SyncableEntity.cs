//-----------------------------------------------------------------------
// <copyright file="SyncableEntity.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasClientDb.Abstracts;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Represents an abstract base class for entities that support vault synchronization.
/// This class provides properties for tracking creation, updates, and soft deletes,
/// which are essential for merging conflicting vault versions across multiple clients.
/// </summary>
public abstract class SyncableEntity
{
    /// <summary>
    /// Gets or sets the created timestamp.
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the last modified timestamp of the record.
    /// This timestamp is used for synchronization and conflict resolution when
    /// merging changes from multiple clients. It enables a "last write wins" strategy
    /// during the sync process, ensuring the most recent version of a record is preserved.
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether this record is marked for deletion.
    /// Records marked as deleted are not returned in regular queries but are retained
    /// for a specified period to ensure proper synchronization across devices.
    /// This "soft delete" approach allows for conflict resolution during sync and
    /// prevents data loss. After the retention period (configurable in the system),
    /// these records are permanently removed during the cleanup process.
    /// </summary>
    [Required]
    public bool IsDeleted { get; set; }
}
