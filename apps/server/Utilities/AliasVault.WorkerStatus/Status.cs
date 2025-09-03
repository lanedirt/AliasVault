// -----------------------------------------------------------------------
// <copyright file="Status.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.WorkerStatus;

/// <summary>
/// Enumeration of possible statuses for a worker service.
/// </summary>
public enum Status
{
    /// <summary>
    /// Indicates that the worker service has started.
    /// </summary>
    Started,

    /// <summary>
    /// Indicates that the worker service is starting.
    /// </summary>
    Starting,

    /// <summary>
    /// Indicates that the worker service is stopping.
    /// </summary>
    Stopping,

    /// <summary>
    /// Indicates that the worker service has stopped.
    /// </summary>
    Stopped,
}
