//-----------------------------------------------------------------------
// <copyright file="KeePassCsvRecord.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Models.Imports;

/// <summary>
/// Represents a KeePass CSV record that is being imported from a KeePass CSV export file.
/// </summary>
public class KeePassCsvRecord
{
    /// <summary>
    /// Gets or sets the title/service name (e.g., "Facebook", "Gmail").
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the email address.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    public string? URL { get; set; }

    /// <summary>
    /// Gets or sets the OTP (One-Time Password) authentication secret.
    /// </summary>
    public string? OTPAuth { get; set; }

    /// <summary>
    /// Gets or sets any additional notes.
    /// </summary>
    public string? Notes { get; set; }
}
