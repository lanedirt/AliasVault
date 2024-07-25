//-----------------------------------------------------------------------
// <copyright file="WorkerStatusDbContext.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using Microsoft.EntityFrameworkCore;

namespace AliasVault.WorkerStatus.Database;

/// <summary>
/// WorkerStatusDbContext class.
/// </summary>
public class WorkerStatusDbContext : DbContext, IWorkerStatusDbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="WorkerStatusDbContext"/> class.
    /// </summary>
    public WorkerStatusDbContext()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="WorkerStatusDbContext"/> class.
    /// </summary>
    /// <param name="options">DbContextOptions instance.</param>
    public WorkerStatusDbContext(DbContextOptions options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the WorkerServiceStatus DbSet.
    /// </summary>
    public DbSet<WorkerServiceStatus> WorkerServiceStatuses { get; set; }
}

