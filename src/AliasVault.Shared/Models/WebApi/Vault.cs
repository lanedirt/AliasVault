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
    /// <param name="encryptionPublicKey">Public encryption key that server requires to encrypt user data such as received emails.</param>
    /// <param name="emailAddressList">List of email addresses that are used in the vault and should be registered.</param>
    /// <param name="createdAt">CreatedAt.</param>
    /// <param name="updatedAt">UpdatedAt.</param>
    public Vault(string blob, string version, string encryptionPublicKey, List<string> emailAddressList, DateTime createdAt, DateTime updatedAt)
    {
        Blob = blob;
        Version = version;
        EncryptionPublicKey = encryptionPublicKey;
        EmailAddressList = emailAddressList;
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
    /// Gets or sets the public encryption key that server requires to encrypt user data such as received emails.
    /// </summary>
    public string EncryptionPublicKey { get; set; }

    /// <summary>
    /// Gets or sets the list of email addresses that are used in the vault and should be registered on the server.
    /// </summary>
    public List<string> EmailAddressList { get; set; }

    /// <summary>
    /// Gets or sets the date and time of creation.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time of last update.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
