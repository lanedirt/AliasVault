//-----------------------------------------------------------------------
// <copyright file="ImportCredential.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Main.Pages.Settings.ImportExport.Models;

/// <summary>
/// Represents a credential in an intermediary format for importing from various sources.
/// This model is designed to be flexible enough to handle different import formats while
/// maintaining all the essential fields needed for AliasVault credentials.
/// </summary>
public class ImportCredential
{
    /// <summary>
    /// Gets or sets the service name (e.g., "Facebook", "Gmail").
    /// </summary>
    public string ServiceName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    public string? ServiceUrl { get; set; }

    /// <summary>
    /// Gets or sets the username or email.
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the email address.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Gets or sets the 2FA secret key.
    /// </summary>
    public string? TwoFactorSecret { get; set; }

    /// <summary>
    /// Gets or sets any additional notes.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets the creation date of the credential.
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the last modified date of the credential.
    /// </summary>
    public DateTime? ModifiedAt { get; set; }

    /// <summary>
    /// Gets or sets the favicon bytes.
    /// </summary>
    public byte[]? FaviconBytes { get; set; }
}
