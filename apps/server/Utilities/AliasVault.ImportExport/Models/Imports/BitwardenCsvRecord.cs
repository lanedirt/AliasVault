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
/// Represents a Bitwarden CSV record that is being imported from a Bitwarden CSV export file.
/// </summary>
public class BitwardenCsvRecord
{
    /// <summary>
    /// Gets or sets the folder name.
    /// </summary>
    [Name("folder")]
    public string Folder { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether the item is favorited.
    /// </summary>
    [Name("favorite")]
    [TypeConverter(typeof(BooleanConverter))]
    public bool Favorite { get; set; } = false;

    /// <summary>
    /// Gets or sets the type of the item.
    /// </summary>
    [Name("type")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the title/service name (e.g., "Facebook", "Gmail").
    /// </summary>
    [Name("name")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets any additional notes.
    /// </summary>
    [Name("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets custom fields.
    /// </summary>
    [Name("fields")]
    public string? Fields { get; set; }

    /// <summary>
    /// Gets or sets whether to reprompt for the master password.
    /// </summary>
    [Name("reprompt")]
    public bool Reprompt { get; set; }

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    [Name("login_uri")]
    public string? URL { get; set; }

    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    [Name("login_username")]
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Name("login_password")]
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets the OTP (One-Time Password) authentication secret.
    /// </summary>
    [Name("login_totp")]
    public string? OTPAuth { get; set; }
}
