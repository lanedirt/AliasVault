//-----------------------------------------------------------------------
// <copyright file="ProtonPassCsvRecord.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Models.Imports;

using CsvHelper.Configuration.Attributes;

/// <summary>
/// Represents a ProtonPass CSV record that is being imported from a ProtonPass CSV export file.
/// </summary>
public class ProtonPassCsvRecord
{
    /// <summary>
    /// Gets or sets the type of the item (e.g., login, alias).
    /// </summary>
    [Name("type")]
    public string Type { get; set; } = string.Empty;

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
    /// Gets or sets the email of the item.
    /// </summary>
    [Name("email")]
    public string Email { get; set; } = string.Empty;

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
    /// Gets or sets any additional notes.
    /// </summary>
    [Name("note")]
    public string? Note { get; set; }

    /// <summary>
    /// Gets or sets the TOTP (Time-based One-Time Password) URI.
    /// </summary>
    [Name("totp")]
    public string? Totp { get; set; }

    /// <summary>
    /// Gets or sets the creation time of the item.
    /// </summary>
    [Name("createTime")]
    public string CreateTime { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the modification time of the item.
    /// </summary>
    [Name("modifyTime")]
    public string ModifyTime { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the vault name where the item is stored.
    /// </summary>
    [Name("vault")]
    public string Vault { get; set; } = string.Empty;
}
