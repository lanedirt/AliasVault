//-----------------------------------------------------------------------
// <copyright file="GlobalServiceStatus.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WorkerStatus;

using System.Collections.Concurrent;

/// <summary>
/// Global service status class for monitoring and control.
/// </summary>
public class GlobalServiceStatus
{
    private readonly ConcurrentDictionary<string, bool> _workerStatuses = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="GlobalServiceStatus"/> class.
    /// </summary>
    /// <param name="serviceName">Name of the service that we are keeping track of.</param>
    public GlobalServiceStatus(string serviceName)
    {
        ServiceName = serviceName;
    }

    /// <summary>
    /// Gets or sets the status of the service.
    /// </summary>
    public string Status { get; set; } = "Stopped";

    /// <summary>
    /// Gets or sets the current status of the service.
    /// </summary>
    public string CurrentStatus { get; set; } = "Stopped";

    /// <summary>
    /// Gets or sets the ServiceName in order to identify the service and its workers in the database.
    /// </summary>
    public string ServiceName { get; set; }

    /// <summary>
    /// Register a worker with the service.
    /// </summary>
    /// <param name="workerName">Name of the worker.</param>
    public void RegisterWorker(string workerName)
    {
        _workerStatuses[workerName] = false;
    }

    /// <summary>
    /// Set the status of a worker.
    /// </summary>
    /// <param name="workerName">Name of the worker.</param>
    /// <param name="isRunning">Boolean which indicates if worker is currently running.</param>
    public void SetWorkerStatus(string workerName, bool isRunning)
    {
        if (_workerStatuses.ContainsKey(workerName))
        {
            _workerStatuses[workerName] = isRunning;
        }
    }

    /// <summary>
    /// Returns boolean indicating if all workers are running.
    /// </summary>
    /// <returns>Boolean which indicates if all workers are started.</returns>
    public bool AreAllWorkersRunning() => _workerStatuses.All(w => w.Value);

    /// <summary>
    /// Returns boolean indicating if all workers are stopped.
    /// </summary>
    /// <returns>Boolean which indicates if all workers are stopped.</returns>
    public bool AreAllWorkersStopped() => _workerStatuses.All(w => !w.Value);
}
