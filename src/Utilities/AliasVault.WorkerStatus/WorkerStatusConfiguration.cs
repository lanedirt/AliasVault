//-----------------------------------------------------------------------
// <copyright file="WorkerStatusConfiguration.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WorkerStatus;

/// <summary>
/// Interface for the WorkerStatusDbContext.
/// </summary>
public class WorkerStatusConfiguration
{
    /// <summary>
    /// Gets or sets the GlobalServiceStatus for the WorkerStatusDbContext.
    /// </summary>
    public GlobalServiceStatus GlobalServiceStatus { get; set; } = null!;

    /// <summary>
    /// Gets or sets the ServiceName for the WorkerStatusDbContext.
    /// </summary>
    public string ServiceName { get; set; } = null!;
}
