//-----------------------------------------------------------------------
// <copyright file="StatusWorker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasVault.WorkerStatus.Database;

namespace AliasVault.WorkerStatus;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>
/// StatusWorker class for monitoring and controlling the status of the worker services.
/// </summary>
public class StatusWorker(ILogger<StatusWorker> logger, WorkerStatusConfiguration config, Func<IWorkerStatusDbContext> createDbContext) : BackgroundService
{
    private IWorkerStatusDbContext _dbContext = null!;

    /// <summary>
    /// Worker service execution method.
    /// </summary>
    /// <param name="stoppingToken">CancellationToken.</param>
    /// <returns>Task.</returns>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _dbContext = createDbContext();

            try
            {
                var statusEntry = await GetServiceStatus();
                switch (statusEntry.CurrentStatus)
                {
                    case "Starting":
                        await WaitForAllWorkersToStart(stoppingToken);
                        await SetServiceStatus(statusEntry, "Started");
                        logger.LogInformation("All workers started.");
                        break;
                    case "Stopping":
                        await WaitForAllWorkersToStop(stoppingToken);
                        await SetServiceStatus(statusEntry, "Stopped");
                        logger.LogInformation("All workers stopped.");
                        break;
                    case "Stopped":
                        logger.LogInformation("Service is (soft) stopped.");
                        break;
                }
            }
            catch (Exception e)
            {
                logger.LogError(e, "Global main application exception");
            }

            await Task.Delay(5000, stoppingToken);
        }

        // If we reach this point, the service is hard stopping: not in software but on OS level.
        // Mark the service as stopped.
        _dbContext = createDbContext();
        await SetServiceStatus(await GetServiceStatus(), "Stopped");
    }

    /// <summary>
    /// Gets the current status record of the service from database.
    /// </summary>
    /// <returns>New current status.</returns>
    private async Task<WorkerServiceStatus> GetServiceStatus()
    {
        var entry = await GetOrCreateInitialStatusRecord();

        if (!string.IsNullOrEmpty(entry.DesiredStatus) && entry.CurrentStatus != entry.DesiredStatus)
        {
            entry.CurrentStatus = entry.DesiredStatus switch
            {
                "Started" => "Starting",
                "Stopped" => "Stopping",
                _ => entry.CurrentStatus,
            };
        }

        config.GlobalServiceStatus.Status = entry.CurrentStatus;
        config.GlobalServiceStatus.CurrentStatus = entry.CurrentStatus;

        entry.Heartbeat = DateTime.Now;
        await _dbContext.SaveChangesAsync();

        return entry;
    }

    /// <summary>
    /// Updates the status of the service.
    /// </summary>
    /// <param name="statusEntry">The WorkerServiceStatus entry to update.</param>
    /// <param name="newStatus">The new status.</param>
    /// <returns>New current status.</returns>
    private async Task SetServiceStatus(WorkerServiceStatus statusEntry, string newStatus = "")
    {
        if (!string.IsNullOrEmpty(newStatus) && statusEntry.CurrentStatus != newStatus)
        {
            statusEntry.CurrentStatus = newStatus;
        }

        var status = statusEntry.CurrentStatus;
        config.GlobalServiceStatus.Status = status;
        config.GlobalServiceStatus.CurrentStatus = status;

        statusEntry.Heartbeat = DateTime.Now;
        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Waits for all workers to start.
    /// </summary>
    /// <param name="stoppingToken">CancellationToken.</param>
    private async Task WaitForAllWorkersToStart(CancellationToken stoppingToken)
    {
        while (!config.GlobalServiceStatus.AreAllWorkersRunning())
        {
            logger.LogInformation("Waiting for all workers to start...");
            await Task.Delay(1000, stoppingToken);
        }
    }

    /// <summary>
    /// Waits for all workers to stop.
    /// </summary>
    /// <param name="stoppingToken">CancellationToken.</param>
    private async Task WaitForAllWorkersToStop(CancellationToken stoppingToken)
    {
        while (!config.GlobalServiceStatus.AreAllWorkersStopped())
        {
            logger.LogInformation("Waiting for all workers to stop...");
            await Task.Delay(1000, stoppingToken);
        }
    }

    /// <summary>
    /// Retrieves status record or creates an initial status record if it does not exist.
    /// </summary>
    private async Task<WorkerServiceStatus> GetOrCreateInitialStatusRecord()
    {
        var entry = _dbContext.WorkerServiceStatuses.FirstOrDefault(x => x.ServiceName == config.ServiceName);
        if (entry != null)
        {
            return entry;
        }

        entry = new WorkerServiceStatus
        {
            ServiceName = config.ServiceName,
            CurrentStatus = "Started",
            DesiredStatus = string.Empty,
        };
        await _dbContext.WorkerServiceStatuses.AddAsync(entry);

        return entry;
    }
}
