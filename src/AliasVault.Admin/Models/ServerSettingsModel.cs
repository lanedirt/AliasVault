//-----------------------------------------------------------------------
// <copyright file="ServerSettingsModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Models;

/// <summary>
/// Server settings model.
/// </summary>
public class ServerSettingsModel
{
    /// <summary>
    /// Gets or sets the general log retention days.
    /// </summary>
    public int GeneralLogRetentionDays { get; set; } = 30;

    /// <summary>
    /// Gets or sets the auth log retention days.
    /// </summary>
    public int AuthLogRetentionDays { get; set; } = 90;

    /// <summary>
    /// Gets or sets the email retention days.
    /// </summary>
    public int EmailRetentionDays { get; set; } = 30;

    /// <summary>
    /// Gets or sets the max emails per user.
    /// </summary>
    public int MaxEmailsPerUser { get; set; } = 100;

    /// <summary>
    /// Gets or sets the time when maintenance tasks are run (24h format).
    /// </summary>
    public TimeOnly MaintenanceTime { get; set; } = new TimeOnly(0, 0);

    /// <summary>
    /// Gets or sets the task runner days.
    /// </summary>
    public List<int> TaskRunnerDays { get; set; } = new() { 1, 2, 3, 4, 5, 6, 7 };
}
