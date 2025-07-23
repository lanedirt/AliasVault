//-----------------------------------------------------------------------
// <copyright file="RecentUsageRegistrations.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Models;

/// <summary>
/// Model representing IP addresses with most registrations in the last 72 hours.
/// </summary>
public class RecentUsageRegistrations
{
    /// <summary>
    /// Gets or sets the original IP address (for linking purposes).
    /// </summary>
    public string OriginalIpAddress { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the anonymized IP address.
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the number of registrations from this IP in the last 72 hours.
    /// </summary>
    public int RegistrationCount72h { get; set; }
}
