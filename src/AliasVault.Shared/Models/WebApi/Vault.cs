//-----------------------------------------------------------------------
// <copyright file="Vault.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

/// <summary>
/// Vault model.
/// </summary>
public class Vault
{
    /// <summary>
    /// Initializes a new instance of the <see cref="Vault"/> class.
    /// </summary>
    /// <param name="blob">Blob.</param>
    /// <param name="version">Version of the vault data model (migration).</param>
    /// <param name="createdAt">CreatedAt.</param>
    /// <param name="updatedAt">UpdatedAt.</param>
    public Vault(string blob, string version, DateTime createdAt, DateTime updatedAt)
    {
        Blob = blob;
        Version = version;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    /// <summary>
    /// Gets or sets the vault blob.
    /// </summary>
    public string Blob { get; set; }

    /// <summary>
    /// Gets or sets the vault version.
    /// </summary>
    public string Version { get; set; }

    /// <summary>
    /// Gets or sets the date and time of creation.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time of last update.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
