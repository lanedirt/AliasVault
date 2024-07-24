//-----------------------------------------------------------------------
// <copyright file="Log.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
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
    [Column(TypeName = "nvarchar(50)")]
    public string Application { get; set; } = null!;

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
    [Column(TypeName = "nvarchar(128)")]
    public string Level { get; set; } = null!;

    /// <summary>
    /// Gets or sets the timestamp of the log entry.
    /// </summary>
    public DateTimeOffset TimeStamp { get; set; }

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
