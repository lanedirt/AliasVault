//-----------------------------------------------------------------------
// <copyright file="LastPassCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using CsvHelper.Configuration.Attributes;

namespace AliasVault.ImportExport.Models.Imports;

/// <summary>
/// Represents a LastPass CSV record that is being imported from a LastPass CSV export file.
/// </summary>
public class LastPassCsvRecord
{
    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    [Name("url")]
    public string? URL { get; set; }

    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    [Name("username")]
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Name("password")]
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets the two-factor authentication secret.
    /// </summary>
    [Name("totp")]
    public string? TwoFactorSecret { get; set; }

    /// <summary>
    /// Gets or sets any additional extra fields.
    /// </summary>
    [Name("extra")]
    public string? Extra { get; set; }

    /// <summary>
    /// Gets or sets the title/service name (e.g., "Facebook", "Gmail").
    /// </summary>
    [Name("name")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the grouping (folder name).
    /// </summary>
    [Name("grouping")]
    public string? Grouping { get; set; }

    /// <summary>
    /// Gets or sets whether the item is favorited.
    /// </summary>
    [Name("fav")]
    public string? Favorite { get; set; }
}
