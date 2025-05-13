//-----------------------------------------------------------------------
// <copyright file="EmailCleanupTask.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.TaskRunner.Tasks;

using AliasServerDb;
using AliasVault.Shared.Server.Services;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// A maintenance task that deletes old emails based on server settings.
/// </summary>
public class EmailCleanupTask : IMaintenanceTask
{
    private readonly ILogger<EmailCleanupTask> _logger;
    private readonly IAliasServerDbContextFactory _dbContextFactory;
    private readonly ServerSettingsService _settingsService;

    /// <summary>
    /// Initializes a new instance of the <see cref="EmailCleanupTask"/> class.
    /// </summary>
    /// <param name="logger">The logger.</param>
    /// <param name="dbContextFactory">The database context factory.</param>
    /// <param name="settingsService">The settings service.</param>
    public EmailCleanupTask(
        ILogger<EmailCleanupTask> logger,
        IAliasServerDbContextFactory dbContextFactory,
        ServerSettingsService settingsService)
    {
        _logger = logger;
        _dbContextFactory = dbContextFactory;
        _settingsService = settingsService;
    }

    /// <inheritdoc />
    public string Name => "Email Cleanup";

    /// <inheritdoc />
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetAllSettingsAsync();
        if (settings.EmailRetentionDays <= 0)
        {
            return;
        }

        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var cutoffDate = DateTime.UtcNow.AddDays(-settings.EmailRetentionDays);

        // Delete the emails
        var emailsDeleted = await dbContext.Emails
            .Where(x => x.DateSystem < cutoffDate)
            .ExecuteDeleteAsync(cancellationToken);

        _logger.LogWarning(
            "Deleted {EmailCount} emails older than {Days} days",
            emailsDeleted,
            settings.EmailRetentionDays);
    }
}
