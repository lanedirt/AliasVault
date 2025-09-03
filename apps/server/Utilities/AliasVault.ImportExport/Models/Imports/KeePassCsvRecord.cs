//-----------------------------------------------------------------------
// <copyright file="KeePassCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Models.Imports;

using CsvHelper.Configuration.Attributes;

/// <summary>
/// Represents a KeePass CSV record that is being imported from a KeePass CSV export file.
/// </summary>
public class KeePassCsvRecord
{
    /// <summary>
    /// Gets or sets the title/service name (e.g., "Facebook", "Gmail").
    /// </summary>
    [Name("Account")]
    public string Account { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the login name.
    /// </summary>
    [Name("Login Name")]
    public string? LoginName { get; set; }

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Name("Password")]
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets the web site.
    /// </summary>
    [Name("Web Site")]
    public string? Website { get; set; }

    /// <summary>
    /// Gets or sets the comments.
    /// </summary>
    [Name("Comments")]
    public string? Comments { get; set; }
}
