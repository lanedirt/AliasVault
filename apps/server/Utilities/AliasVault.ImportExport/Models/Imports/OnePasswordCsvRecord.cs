//-----------------------------------------------------------------------
// <copyright file="BitwardenCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasVault.ImportExport.Converters;
using CsvHelper.Configuration.Attributes;

namespace AliasVault.ImportExport.Models.Imports;

/// <summary>
/// Represents a 1Password CSV record that is being imported from a 1Password CSV export file.
/// </summary>
public class OnePasswordCsvRecord
{
    /// <summary>
    /// Gets or sets the title of the item.
    /// </summary>
    [Name("Title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the URL of the item.
    /// </summary>
    [Name("Url")]
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the username of the item.
    /// </summary>
    [Name("Username")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the password of the item.
    /// </summary>
    [Name("Password")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the OTP (One-Time Password) authentication secret.
    /// </summary>
    [Name("OTPAuth")]
    public string? OTPAuth { get; set; }

    /// <summary>
    /// Gets or sets whether the item is favorited.
    /// </summary>
    [Name("Favorite")]
    [TypeConverter(typeof(BooleanConverter))]
    public bool Favorite { get; set; }

    /// <summary>
    /// Gets or sets whether the item is archived.
    /// </summary>
    [Name("Archived")]
    [TypeConverter(typeof(BooleanConverter))]
    public bool Archived { get; set; }

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    [Name("Tags")]
    public string? Tags { get; set; }

    /// <summary>
    /// Gets or sets any additional notes.
    /// </summary>
    [Name("Notes")]
    public string? Notes { get; set; }
}
