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
    private readonly object _taskLock = new();

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken serviceCancellationToken)
    {
        logger.LogInformation("AliasVault.SmtpService.SmtpServerWorker ExecuteAsync called.");

        while (!serviceCancellationToken.IsCancellationRequested)
        {
            var workerCancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(serviceCancellationToken);

            await ExecuteInnerAsync(workerCancellationTokenSource);
            _workerTask = null;

            await Task.Delay(1000, serviceCancellationToken);
        }
    }

    private async Task ExecuteInnerAsync(CancellationTokenSource workerCancellationTokenSource)
    {
        // Shutdown the SMTP server if it's running.
        //smtpServer.Shutdown();
        _workerTask = null;

        while (!workerCancellationTokenSource.IsCancellationRequested)
        {
            if (globalServiceStatus.CurrentStatus == "Started" || globalServiceStatus.CurrentStatus == "Starting")
            {
                // Start the worker in the background with the cancellation token so we can stop it later.
                lock (_taskLock)
                {
                    if (_workerTask == null)
                    {
                        // Create a new cancellation token source for worker.
                        _workerTask = Task.Run(() => WorkerLogic(workerCancellationTokenSource.Token),
                            workerCancellationTokenSource.Token);
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
                // Reset the worker task if the service is stopped so it can be started again later.
                _workerTask = null;
                break;
            }
        }
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

            // Set worker status to true for acknowledgement.
            globalServiceStatus.SetWorkerStatus(nameof(SmtpServerWorker), true);

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

            // Set worker status to false for acknowledgement.
            globalServiceStatus.SetWorkerStatus(nameof(SmtpServerWorker), false);
        }
    }
}
