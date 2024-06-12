//-----------------------------------------------------------------------
// <copyright file="TokenModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Text.Json.Serialization;

namespace AliasVault.Shared.Models;

/// <summary>
/// Token model.
/// </summary>
public class TokenModel
{
    /// <summary>
    /// Gets or sets the token.
    /// </summary>
    [JsonPropertyName("token")]
    public string Token { get; set; } = null!;

    /// <summary>
    /// Gets or sets the refresh token.
    /// </summary>
    [JsonPropertyName("refreshToken")]
    public string RefreshToken { get; set; } = null!;
}
