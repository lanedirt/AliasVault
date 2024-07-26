//-----------------------------------------------------------------------
// <copyright file="StatusHostedService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WorkerStatus.ServiceExtensions;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>
/// StatusHostedService class.
/// </summary>
/// <typeparam name="T">The HostedService to add.</typeparam>
public class StatusHostedService<T>(ILogger<StatusHostedService<T>> logger, GlobalServiceStatus globalServiceStatus, T innerService) : BackgroundService
    where T : IHostedService
{
    /// <summary>
    /// A minimum delay that is used to wait before restarting the worker after a fault in the innerService.
    /// This delay is increased exponentially with a maximum delay of <see cref="_restartMaxDelayInMs"/>.
    /// </summary>
    private const int _restartMinDelayInMs = 1000;

    /// <summary>
    /// Maximum delay before restarting the worker.
    /// </summary>
    private const int _restartMaxDelayInMs = 300000;

    /// <summary>
    /// Current delay before restarting the worker.
    /// </summary>
    private int _restartDelayInMs = _restartMinDelayInMs;

    private readonly object _taskLock = new();
    private Task? _workerTask;

    /// <summary>
    /// Default entry point called by the host.
    /// </summary>
    /// <param name="serviceCancellationToken">Cancellation token.</param>
    /// <returns>Task.</returns>
    protected override async Task ExecuteAsync(CancellationToken serviceCancellationToken)
    {
        logger.LogInformation("StatusHostedService<{ServiceType}> ExecuteAsync called.", typeof(T).Name);

        // Register the service with the global service status so the StatusWorker will monitor it.
        globalServiceStatus.RegisterWorker(typeof(T).Name);

        while (!serviceCancellationToken.IsCancellationRequested)
        {
            // Add a second cancellationToken linked to the parent cancellation token.
            // When the parent gets canceled this gets canceled as well. However, this one can also
            // be canceled with a signal from the StatusWorker.
            var workerCancellationTokenSource =
                CancellationTokenSource.CreateLinkedTokenSource(serviceCancellationToken);

            // Start the inner while loop with the second cancellationToken.
            await ExecuteInnerAsync(workerCancellationTokenSource);

            if (!serviceCancellationToken.IsCancellationRequested)
            {
                // If the worker was not stopped, wait for a second before attempting to restart it.
                await Task.Delay(1000, serviceCancellationToken);
            }
        }
    }

    /// <summary>
    /// Start the inner while loop which adds a second cancellationToken that is controlled by the StatusWorker.
    /// </summary>
    /// <param name="workerCancellationTokenSource">Cancellation token.</param>
    private async Task ExecuteInnerAsync(CancellationTokenSource workerCancellationTokenSource)
    {
        _workerTask = null;

        while (!workerCancellationTokenSource.IsCancellationRequested)
        {
            if (globalServiceStatus.CurrentStatus == "Started" || globalServiceStatus.CurrentStatus == "Starting")
            {
                lock (_taskLock)
                {
                    if (_workerTask == null)
                    {
                        globalServiceStatus.SetWorkerStatus(typeof(T).Name, true);
                        _workerTask = Task.Run(() => WorkerLogic(workerCancellationTokenSource.Token), workerCancellationTokenSource.Token);
                    }
                }
            }
            else if (globalServiceStatus.CurrentStatus == "Stopping")
            {
                // If the StatusWorker has given us the signal to stop, cancel the inner worker.
                await workerCancellationTokenSource.CancelAsync();
                globalServiceStatus.SetWorkerStatus(typeof(T).Name, false);
            }
            else if (globalServiceStatus.CurrentStatus == "Stopped")
            {
                _workerTask = null;
                break;
            }
        }
    }

    /// <summary>
    /// The worker logic that is executed by the inner service. This wraps the actual inner service logic
    /// in a try/catch block to catch any exceptions and to set the worker status to false when the worker stops.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task WorkerLogic(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                globalServiceStatus.SetWorkerStatus(typeof(T).Name, true);

                await innerService.StartAsync(cancellationToken);

                await Task.Delay(Timeout.Infinite, cancellationToken);
            }
            catch (OperationCanceledException ex)
            {
                // Expected so we only log information.
                logger.LogInformation(ex, "StatusHostedService<{ServiceType}> is stopping due to a cancellation request.", typeof(T).Name);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred in StatusHostedService<{ServiceType}>", typeof(T).Name);
            }
            finally
            {
                logger.LogWarning("StatusHostedService<{ServiceType}> stopped at: {Time}", typeof(T).Name, DateTimeOffset.Now);
                globalServiceStatus.SetWorkerStatus(typeof(T).Name, false);
            }

            // If a fault occurred in the innerService but it was not canceled,
            // wait for a second before attempting to auto-restart the worker.
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(_restartDelayInMs, cancellationToken);
                    break; // Exit the loop if delay is successful
                }
                catch (TaskCanceledException)
                {
                    // If the delay is canceled, exit the loop
                    break;
                }
            }

            // Exponential backoff with a maximum delay
            _restartDelayInMs = Math.Min(_restartDelayInMs * 2, _restartMaxDelayInMs);
        }
    }
}
