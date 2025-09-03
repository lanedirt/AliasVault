//-----------------------------------------------------------------------
// <copyright file="ChromeCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Models.Imports;

using CsvHelper.Configuration.Attributes;

/// <summary>
/// Represents a Chrome CSV record that is being imported from a Chrome CSV export file.
/// </summary>
public class ChromeCsvRecord
{
    /// <summary>
    /// Gets or sets the name of the item.
    /// </summary>
    [Name("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the URL of the item.
    /// </summary>
    [Name("url")]
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the username of the item.
    /// </summary>
    [Name("username")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the username of the item.
    /// </summary>
    [Name("password")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets any additional notes.
    /// </summary>
    [Name("note")]
    public string? Note { get; set; }
}
