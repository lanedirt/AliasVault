//-----------------------------------------------------------------------
// <copyright file="IWorkerStatusDbContext.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WorkerStatus.Database;

using Microsoft.EntityFrameworkCore;

/// <summary>
/// Interface for the WorkerStatusDbContext. Inherit from this interface to include the WorkerServiceStatus DbSet
/// which is used to store the status of worker services.
/// </summary>
public interface IWorkerStatusDbContext : IDisposable
{
    /// <summary>
    /// Gets or sets the WorkerServiceStatus DbSet.
    /// </summary>
    public DbSet<WorkerServiceStatus> WorkerServiceStatuses { get; set; }

    /// <summary>
    /// Save changes to the database.
    /// </summary>
    /// <returns>Count of records affected.</returns>
    public int SaveChanges();

    /// <summary>
    /// Save changes to the database asynchronously.
    /// </summary>
    /// <param name="cancellationToken">CancellationToken instance.</param>
    /// <returns>Task.</returns>
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
