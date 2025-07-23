//-----------------------------------------------------------------------
// <copyright file="RecentUsageEmails.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Models;

/// <summary>
/// Model representing users with most emails received in the last 72 hours.
/// </summary>
public class RecentUsageEmails
{
    /// <summary>
    /// Gets or sets the user ID.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the number of emails received in the last 72 hours.
    /// </summary>
    public int EmailCount72h { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the account is disabled/blocked.
    /// </summary>
    public bool IsDisabled { get; set; }

    /// <summary>
    /// Gets or sets the date when the user registered their account.
    /// </summary>
    public DateTime RegistrationDate { get; set; }
}
