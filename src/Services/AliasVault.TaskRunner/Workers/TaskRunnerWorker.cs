//-----------------------------------------------------------------------
// <copyright file="TaskRunnerWorker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.TaskRunner.Workers;

/// <summary>
/// A worker for the TaskRunner.
/// </summary>
/// <param name="logger">ILogger instance.</param>
public class TaskRunnerWorker(ILogger<TaskRunnerWorker> logger) : BackgroundService
{
    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogWarning("AliasVault.TaskRunnerWorker started at: {Time}", DateTimeOffset.Now);
    }
}
