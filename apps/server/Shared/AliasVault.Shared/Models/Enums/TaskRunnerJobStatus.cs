//-----------------------------------------------------------------------
// <copyright file="TaskRunnerJobStatus.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.Enums;

/// <summary>
/// The status of a task runner job.
/// </summary>
public enum TaskRunnerJobStatus
{
    /// <summary>
    /// The job is pending.
    /// </summary>
    Pending = 0,

    /// <summary>
    /// The job is running.
    /// </summary>
    Running = 1,

    /// <summary>
    /// The job has finished.
    /// </summary>
    Finished = 2,

    /// <summary>
    /// The job has been canceled because the task runner has been stopped.
    /// </summary>
    Canceled = 8,

    /// <summary>
    /// The job has failed.
    /// </summary>
    Error = 9,
}
