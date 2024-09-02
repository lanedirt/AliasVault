//-----------------------------------------------------------------------
// <copyright file="PasswordChangeInitiateResponse.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
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
    public PasswordChangeInitiateResponse(string salt, string serverEphemeral)
    {
        Salt = salt;
        ServerEphemeral = serverEphemeral;
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
}
