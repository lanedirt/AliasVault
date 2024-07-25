//-----------------------------------------------------------------------
// <copyright file="SmtpServerWorker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.SmtpService.Workers;

using AliasVault.WorkerStatus;

public class SmtpServerWorker(ILogger<SmtpServerWorker> logger, GlobalServiceStatus globalServiceStatus, SmtpServer.SmtpServer smtpServer) : BackgroundService
{
    private Task? _workerTask;
    private readonly object _taskLock = new object();

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken serviceCancellationToken)
    {
        logger.LogInformation("AliasVault.SmtpService.SmtpServerWorker ExecuteAsync called.");

        // Create a new cancellation token source for worker.
        using var workerCancellationTokenSource = new CancellationTokenSource();
        var workerCancellationToken = workerCancellationTokenSource.Token;

        while (!serviceCancellationToken.IsCancellationRequested)
        {
            if (globalServiceStatus.CurrentStatus == "Started" || globalServiceStatus.CurrentStatus == "Starting")
            {
                // Set worker status to true for acknowledgement.
                globalServiceStatus.SetWorkerStatus(nameof(SmtpServerWorker), true);

                // Start the worker in the background.
                lock (_taskLock)
                {
                    if (_workerTask == null)
                    {
                        // Reset the worker cancellation token if it was canceled before
                        _workerTask = Task.Run(() => WorkerLogic(workerCancellationToken), workerCancellationToken);
                    }
                }
            }
            else if (globalServiceStatus.CurrentStatus == "Stopping")
            {
                // Request the worker to stop.
                await workerCancellationTokenSource.CancelAsync();
            }
            else if (globalServiceStatus.CurrentStatus == "Stopped")
            {
                // Ensure worker task is completed and reset it so it can be started again.
                if (_workerTask != null)
                {
                    try
                    {
                        await _workerTask;
                    }
                    catch (OperationCanceledException)
                    {
                        // Task was cancelled, handle if needed.
                    }
                    _workerTask = null;
                }
            }

            await Task.Delay(1000, serviceCancellationToken);
        }

        // If we reach this point, the service is hard stopping: not in software but on OS level.
        // Request the actual worker to stop.
        await workerCancellationTokenSource.CancelAsync();
    }

    /// <summary>
    /// Actual worker logic.
    /// </summary>
    /// <param name="stoppingToken"></param>
    private async Task WorkerLogic(CancellationToken stoppingToken)
    {
        try
        {
            logger.LogWarning("AliasVault.SmtpService starting at: {Time}", DateTimeOffset.Now);

            // Start the SMTP server
            await smtpServer.StartAsync(stoppingToken);

            // Wait for the cancellation token to be triggered
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException ex)
        {
            // This exception is thrown when the stoppingToken is canceled
            // It's expected behavior, so we can just log it
            logger.LogWarning(ex, "AliasVault.SmtpService is stopping due to a cancellation request.");
        }
        catch (Exception ex)
        {
            // Log any unexpected exceptions
            logger.LogError(ex, "An error occurred in AliasVault.SmtpService");
        }
        finally
        {
            // Log that the service is stopping, whether it's due to cancellation or an error
            logger.LogWarning("AliasVault.SmtpService stopped at: {Time}", DateTimeOffset.Now);

            // Ensure the SMTP server is stopped
            smtpServer.Shutdown();

            // Set worker status to false for acknowledgement.
            globalServiceStatus.SetWorkerStatus(nameof(SmtpServerWorker), false);
        }
    }
}
