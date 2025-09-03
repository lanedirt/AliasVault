//-----------------------------------------------------------------------
// <copyright file="DashlaneCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasVault.ImportExport.Converters;
using CsvHelper.Configuration.Attributes;

namespace AliasVault.ImportExport.Models.Imports;

/// <summary>
/// Represents a Dashlane CSV record that is being imported from a Dashlane CSV export file.
/// </summary>
public class DashlaneCsvRecord
{
    /// <summary>
    /// Gets or sets the primary username.
    /// </summary>
    [Name("username")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the second username.
    /// </summary>
    [Name("username2")]
    public string? Username2 { get; set; }

    /// <summary>
    /// Gets or sets the third username.
    /// </summary>
    [Name("username3")]
    public string? Username3 { get; set; }

    /// <summary>
    /// Gets or sets the title/service name.
    /// </summary>
    [Name("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Name("password")]
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets any additional notes.
    /// </summary>
    [Name("note")]
    public string? Note { get; set; }

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    [Name("url")]
    public string? URL { get; set; }

    /// <summary>
    /// Gets or sets the category.
    /// </summary>
    [Name("category")]
    public string? Category { get; set; }

    /// <summary>
    /// Gets or sets the OTP URL.
    /// </summary>
    [Name("otpUrl")]
    public string? OTPUrl { get; set; }
}
