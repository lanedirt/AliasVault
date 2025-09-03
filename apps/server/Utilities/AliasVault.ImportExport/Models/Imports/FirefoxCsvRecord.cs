//-----------------------------------------------------------------------
// <copyright file="FirefoxCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Models.Imports;

using CsvHelper.Configuration.Attributes;

/// <summary>
/// Represents a Firefox CSV record that is being imported from a Firefox CSV export file.
/// </summary>
public class FirefoxCsvRecord
{
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
    /// Gets or sets the password of the item.
    /// </summary>
    [Name("password")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the HTTP realm for authentication.
    /// </summary>
    [Name("httpRealm")]
    public string? HttpRealm { get; set; }

    /// <summary>
    /// Gets or sets the form action origin URL.
    /// </summary>
    [Name("formActionOrigin")]
    public string? FormActionOrigin { get; set; }

    /// <summary>
    /// Gets or sets the GUID of the password entry.
    /// </summary>
    [Name("guid")]
    public string? Guid { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the password was created.
    /// </summary>
    [Name("timeCreated")]
    public string? TimeCreated { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the password was last used.
    /// </summary>
    [Name("timeLastUsed")]
    public string? TimeLastUsed { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the password was last changed.
    /// </summary>
    [Name("timePasswordChanged")]
    public string? TimePasswordChanged { get; set; }
}
