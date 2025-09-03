//-----------------------------------------------------------------------
// <copyright file="Log.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// Represents a log entry in the AliasServerDb.
/// </summary>
public class Log
{
    /// <summary>
    /// Gets or sets the unique identifier of the log entry.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the application name associated with the log entry.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Application { get; set; } = null!;

    /// <summary>
    /// Gets or sets the source context that triggered this log message.
    /// </summary>
    [MaxLength(255)]
    public string SourceContext { get; set; } = null!;

    /// <summary>
    /// Gets or sets the log message.
    /// </summary>
    public string Message { get; set; } = null!;

    /// <summary>
    /// Gets or sets the message template for the log entry.
    /// </summary>
    public string MessageTemplate { get; set; } = null!;

    /// <summary>
    /// Gets or sets the log level.
    /// </summary>
    [MaxLength(128)]
    public string Level { get; set; } = null!;

    /// <summary>
    /// Gets or sets the timestamp of the log entry.
    /// </summary>
    public DateTime TimeStamp { get; set; }

    /// <summary>
    /// Gets or sets the exception associated with the log entry.
    /// </summary>
    public string Exception { get; set; } = null!;

    /// <summary>
    /// Gets or sets the additional properties of the log entry.
    /// </summary>
    public string Properties { get; set; } = null!;

    /// <summary>
    /// Gets or sets the log event.
    /// </summary>
    [Column("LogEvent")]
    public string LogEvent { get; set; } = null!;
}
