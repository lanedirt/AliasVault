//-----------------------------------------------------------------------
// <copyright file="ServerStatistics.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Models;

/// <summary>
/// Model representing comprehensive server statistics and metrics.
/// </summary>
public class ServerStatistics
{
    /// <summary>
    /// Gets or sets the total number of users registered on the server.
    /// </summary>
    public int TotalUsers { get; set; }

    /// <summary>
    /// Gets or sets the total number of email aliases created.
    /// </summary>
    public int TotalAliases { get; set; }

    /// <summary>
    /// Gets or sets the total number of emails stored.
    /// </summary>
    public int TotalEmails { get; set; }

    /// <summary>
    /// Gets or sets the total number of email attachments.
    /// </summary>
    public int TotalEmailAttachments { get; set; }

    /// <summary>
    /// Gets or sets the list of top users by storage size.
    /// </summary>
    public List<TopUserByStorage> TopUsersByStorage { get; set; } = new();

    /// <summary>
    /// Gets or sets the list of top users by number of aliases.
    /// </summary>
    public List<TopUserByAliases> TopUsersByAliases { get; set; } = new();

    /// <summary>
    /// Gets or sets the list of top users by number of emails.
    /// </summary>
    public List<TopUserByEmails> TopUsersByEmails { get; set; } = new();

    /// <summary>
    /// Gets or sets the list of top IP addresses by user activity.
    /// </summary>
    public List<TopIpAddress> TopIpAddresses { get; set; } = new();
}
