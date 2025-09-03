//-----------------------------------------------------------------------
// <copyright file="KeepassXcCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Models.Imports;

using CsvHelper.Configuration.Attributes;

/// <summary>
/// Represents a KeePassXC CSV record that is being imported from a KeePassXC CSV export file.
/// </summary>
public class KeepassXcCsvRecord
{
    /// <summary>
    /// Gets or sets the group.
    /// </summary>
    [Name("Group")]
    public string Group { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the title.
    /// </summary>
    [Name("Title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    [Name("Username")]
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Name("Password")]
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets the web site.
    /// </summary>
    [Name("URL")]
    public string? URL { get; set; }

    /// <summary>
    /// Gets or sets the notes.
    /// </summary>
    [Name("Notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets the TOTP (Time-based One-Time Password).
    /// </summary>
    [Name("TOTP")]
    public string? TOTP { get; set; }

    /// <summary>
    /// Gets or sets the icon (integer value representing built-in KeePassXC icon index)
    /// </summary>
    [Name("Icon")]
    public string? Icon { get; set; }

    /// <summary>
    /// Gets or sets the last modified date.
    /// </summary>
    [Name("Last Modified")]
    public string? LastModified { get; set; }

    /// <summary>
    /// Gets or sets the created date.
    /// </summary>
    [Name("Created")]
    public string? Created { get; set; }
}
