//-----------------------------------------------------------------------
// <copyright file="Setting.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;
using AliasClientDb.Abstracts;

/// <summary>
/// The service entity.
/// </summary>
public class Setting : SyncableEntity
{
    /// <summary>
    /// Gets or sets the setting key which is also the primary unique key.
    /// </summary>
    [Key]
    [StringLength(255)]
    public string Key { get; set; } = null!;

    /// <summary>
    /// Gets or sets the setting value. The field type is a string, but it can be used to store any type of data
    /// via serialization.
    /// </summary>
    public string? Value { get; set; }
}
