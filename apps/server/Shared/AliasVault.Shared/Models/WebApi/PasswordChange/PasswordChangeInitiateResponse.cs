//-----------------------------------------------------------------------
// <copyright file="PasswordChangeInitiateResponse.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.PasswordChange;

using System.Text.Json.Serialization;

/// <summary>
/// Represents a login response.
/// </summary>
public class PasswordChangeInitiateResponse
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PasswordChangeInitiateResponse"/> class.
    /// </summary>
    /// <param name="salt">Salt.</param>
    /// <param name="serverEphemeral">Server ephemeral.</param>
    /// <param name="encryptionType">Encryption type.</param>
    /// <param name="encryptionSettings">Encryption settings.</param>
    public PasswordChangeInitiateResponse(string salt, string serverEphemeral, string encryptionType, string encryptionSettings)
    {
        Salt = salt;
        ServerEphemeral = serverEphemeral;
        EncryptionType = encryptionType;
        EncryptionSettings = encryptionSettings;
    }

    /// <summary>
    /// Gets or sets the salt.
    /// </summary>
    [JsonPropertyName("salt")]
    public string Salt { get; set; }

    /// <summary>
    /// Gets or sets the server's public ephemeral value.
    /// </summary>
    [JsonPropertyName("serverEphemeral")]
    public string ServerEphemeral { get; set; }

    /// <summary>
    /// Gets or sets the encryption type.
    /// </summary>
    [JsonPropertyName("encryptionType")]
    public string EncryptionType { get; set; }

    /// <summary>
    /// Gets or sets the encryption settings.
    /// </summary>
    [JsonPropertyName("encryptionSettings")]
    public string EncryptionSettings { get; set; }
}
