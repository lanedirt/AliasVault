//-----------------------------------------------------------------------
// <copyright file="StatusResponse.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth;

/// <summary>
/// Response model for the status endpoint.
/// </summary>
public class StatusResponse
{
    /// <summary>
    /// Gets or sets a value indicating whether the client version is supported by this API.
    /// </summary>
    public required bool Supported { get; set; }

    /// <summary>
    /// Gets or sets the latest vault revision number for the authenticated user, which the client
    /// can use to determine if it should refresh the vault from the server.
    /// </summary>
    public required long VaultRevision { get; set; }
}
