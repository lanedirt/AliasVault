//-----------------------------------------------------------------------
// <copyright file="ServerSetting.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using System;
using System.ComponentModel.DataAnnotations;

/// <summary>
/// Represents a server setting in the AliasServerDb.
/// </summary>
public class ServerSetting
{
    /// <summary>
    /// Gets or sets the key of the server setting.
    /// </summary>
    [Key]
    [MaxLength(255)]
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the value of the server setting.
    /// </summary>
    public string? Value { get; set; }

    /// <summary>
    /// Gets or sets the creation date of the server setting.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the update date of the server setting.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
