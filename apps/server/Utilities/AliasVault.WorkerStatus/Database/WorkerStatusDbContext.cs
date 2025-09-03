//-----------------------------------------------------------------------
// <copyright file="WorkerStatusDbContext.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WorkerStatus.Database;

using Microsoft.EntityFrameworkCore;

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
