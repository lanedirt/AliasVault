//-----------------------------------------------------------------------
// <copyright file="TopIpAddress.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Models;

/// <summary>
/// Model representing an IP address with high user activity.
/// </summary>
public class TopIpAddress
{
    /// <summary>
    /// Gets or sets the original (non-anonymized) IP address for filtering.
    /// </summary>
    public string OriginalIpAddress { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the anonymized IP address for display.
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the number of unique users from this IP.
    /// </summary>
    public int UniqueUserCount { get; set; }

    /// <summary>
    /// Gets or sets the last activity timestamp.
    /// </summary>
    public DateTime LastActivity { get; set; }
}
