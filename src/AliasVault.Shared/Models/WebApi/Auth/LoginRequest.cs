//-----------------------------------------------------------------------
// <copyright file="LoginRequest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth;

/// <summary>
/// Represents a login request.
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// Initializes a new instance of the <see cref="LoginRequest"/> class.
    /// </summary>
    /// <param name="username">Username.</param>
    public LoginRequest(string username)
    {
        Username = username.ToLowerInvariant().Trim();
    }

    /// <summary>
    /// Gets the username.
    /// </summary>
    public string Username { get; }
}
