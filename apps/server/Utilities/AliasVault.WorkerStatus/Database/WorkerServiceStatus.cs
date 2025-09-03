//-----------------------------------------------------------------------
// <copyright file="WorkerServiceStatus.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WorkerStatus.Database;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// Represents the status of a worker service for monitoring and control.
/// </summary>
public class WorkerServiceStatus
{
    /// <summary>
    /// Gets or sets the unique identifier for the service status.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the name of the service.
    /// </summary>
    [Required]
    [StringLength(255)]
    public string ServiceName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the current status of the service.
    /// </summary>
    [StringLength(50)]
    public string CurrentStatus { get; set; } = null!;

    /// <summary>
    /// Gets or sets the desired status of the service.
    /// </summary>
    [StringLength(50)]
    public string DesiredStatus { get; set; } = null!;

    /// <summary>
    /// Gets or sets the last heartbeat timestamp of the service.
    /// </summary>
    public DateTime Heartbeat { get; set; }
}
