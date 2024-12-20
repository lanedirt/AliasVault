//-----------------------------------------------------------------------
// <copyright file="Config.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api;

/// <summary>
/// Configuration class for the Client project with values loaded from appsettings.json.
/// </summary>
public class Config
{
    /// <summary>
    /// Gets or sets a value indicating whether public registration is enabled.
    /// </summary>
    public bool PublicRegistration { get; set; }
}
