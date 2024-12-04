//-----------------------------------------------------------------------
// <copyright file="TaskRunnerWorker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.TaskRunner.Workers;

using AliasVault.Shared.Server.Services;
using AliasVault.TaskRunner.Tasks;

/// <summary>
/// A worker for the TaskRunner.
/// </summary>
/// <param name="logger">ILogger instance.</param>
/// <param name="tasks">List of maintenance tasks.</param>
/// <param name="settingsService">Server settings service.</param>
public class TaskRunnerWorker(ILogger<TaskRunnerWorker> logger, IEnumerable<IMaintenanceTask> tasks, ServerSettingsService settingsService) : BackgroundService
{
    private DateTime _nextRun = DateTime.MinValue;

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogWarning("TaskRunnerWorker started at: {Time}", DateTimeOffset.Now);

        while (!stoppingToken.IsCancellationRequested)
        {
            var settings = await settingsService.GetAllSettingsAsync();
            var now = DateTime.Now;

            // Calculate if we should run now or wait
            var scheduledTime = settings.MaintenanceTime;
            var currentTime = TimeOnly.FromDateTime(now);
            var shouldRunToday = settings.TaskRunnerDays.Contains((int)now.DayOfWeek);
            var hasPassedScheduledTime = currentTime >= scheduledTime;

            // Run if:
            // 1. We haven't run yet today (nextRun is from previous day)
            // 2. It's a scheduled day
            // 3. The scheduled time has passed
            if (shouldRunToday && hasPassedScheduledTime && now.Date >= _nextRun.Date)
            {
                logger.LogWarning("Starting maintenance tasks at {Time}", now);

                foreach (var task in tasks)
                {
                    try
                    {
                        await task.ExecuteAsync(stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error executing task {TaskName}", task.Name);
                    }
                }

                // Set next run to tomorrow at the scheduled time
                _nextRun = now.Date.AddDays(1);
                logger.LogInformation("Tasks completed. Next run scheduled for date: {NextRun}", _nextRun);
            }

            // Calculate delay until next check
            // Check every minute for schedule changes, but not more often than that
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
