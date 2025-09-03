//-----------------------------------------------------------------------
// <copyright file="DropboxCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using CsvHelper.Configuration.Attributes;

namespace AliasVault.ImportExport.Models.Imports;

/// <summary>
/// Represents a Dropbox CSV record that is being imported from a Dropbox CSV export file.
/// </summary>
public class DropboxCsvRecord
{
    /// <summary>
    /// Gets or sets the title/service name (e.g., "Facebook", "Gmail").
    /// </summary>
    [Name("Name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    [Name("URL")]
    public string? Url { get; set; }

    /// <summary>
    /// Gets or sets the username/login.
    /// </summary>
    [Name("Username")]
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Name("Password")]
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets any additional notes.
    /// </summary>
    [Name("Notes")]
    public string? Notes { get; set; }
}