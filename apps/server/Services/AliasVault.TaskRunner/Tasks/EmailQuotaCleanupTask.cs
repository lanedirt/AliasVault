//-----------------------------------------------------------------------
// <copyright file="EmailQuotaCleanupTask.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.TaskRunner.Tasks;

using AliasServerDb;
using AliasVault.Shared.Server.Services;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// A maintenance task that enforces email quotas by deleting oldest emails when users exceed their limit.
/// </summary>
public class EmailQuotaCleanupTask : IMaintenanceTask
{
    private readonly ILogger<EmailQuotaCleanupTask> _logger;
    private readonly IAliasServerDbContextFactory _dbContextFactory;
    private readonly ServerSettingsService _settingsService;

    /// <summary>
    /// Initializes a new instance of the <see cref="EmailQuotaCleanupTask"/> class.
    /// </summary>
    /// <param name="logger">The logger.</param>
    /// <param name="dbContextFactory">The database context factory.</param>
    /// <param name="settingsService">The settings service.</param>
    public EmailQuotaCleanupTask(
        ILogger<EmailQuotaCleanupTask> logger,
        IAliasServerDbContextFactory dbContextFactory,
        ServerSettingsService settingsService)
    {
        _logger = logger;
        _dbContextFactory = dbContextFactory;
        _settingsService = settingsService;
    }

    /// <inheritdoc />
    public string Name => "Email Quota Cleanup";

    /// <inheritdoc />
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetAllSettingsAsync();
        if (settings.MaxEmailsPerUser <= 0)
        {
            return;
        }

        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);

        // Get all users with their email claims
        var userEmailClaims = await dbContext.UserEmailClaims
            .Select(c => new { c.UserId, c.Address })
            .ToListAsync(cancellationToken);

        var totalEmailsDeleted = 0;
        var usersProcessed = 0;

        // Group email claims by user
        foreach (var userGroup in userEmailClaims.GroupBy(c => c.UserId))
        {
            var userAddresses = userGroup.Select(c => c.Address).ToList();

            // Get total email count for this user
            var emailCount = await dbContext.Emails
                .Where(e => userAddresses.Contains(e.To))
                .CountAsync(cancellationToken);

            if (emailCount > settings.MaxEmailsPerUser)
            {
                // Calculate how many emails need to be deleted
                var deleteCount = emailCount - settings.MaxEmailsPerUser;

                // Delete the oldest emails - attachments will be cascade deleted
                var emailsDeleted = await dbContext.Emails
                    .Where(e => userAddresses.Contains(e.To))
                    .OrderBy(e => e.DateSystem)
                    .Take(deleteCount)
                    .ExecuteDeleteAsync(cancellationToken);

                if (emailsDeleted > 0)
                {
                    totalEmailsDeleted += emailsDeleted;
                    usersProcessed++;
                    _logger.LogWarning(
                        "Deleted {EmailCount} emails for user {UserId} to maintain quota of {MaxEmails}",
                        emailsDeleted,
                        userGroup.Key,
                        settings.MaxEmailsPerUser);
                }
            }
        }

        _logger.LogWarning(
            "Deleted {TotalEmails} emails across {UserCount} users to maintain quota of {MaxEmails} max emails per user",
            totalEmailsDeleted,
            usersProcessed,
            settings.MaxEmailsPerUser);
    }
}
