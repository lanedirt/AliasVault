//-----------------------------------------------------------------------
// <copyright file="SharedConfig.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.Configuration;

/// <summary>
/// Shared configuration model for the AliasVault project that is used by both the API and Admin projects
/// and is used for other shared projects to access common configuration values.
/// </summary>
public class SharedConfig
{
    /// <summary>
    /// Gets or sets a value indicating whether IP logging is enabled, used by the Auth logging service
    /// to determine if the IP address for a request should be logged.
    /// </summary>
    public bool IpLoggingEnabled { get; set; }
}
