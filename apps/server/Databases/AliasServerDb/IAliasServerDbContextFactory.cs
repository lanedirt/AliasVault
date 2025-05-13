//-----------------------------------------------------------------------
// <copyright file="IAliasServerDbContextFactory.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.EntityFrameworkCore;

/// <summary>
/// The AliasServerDbContextFactory interface.
/// </summary>
public interface IAliasServerDbContextFactory
{
    /// <summary>
    /// Creates a new AliasServerDbContext.
    /// </summary>
    /// <returns>The AliasServerDbContext.</returns>
    AliasServerDbContext CreateDbContext();

    /// <summary>
    /// Configures the DbContext options.
    /// </summary>
    /// <param name="optionsBuilder">The DbContextOptionsBuilder.</param>
    void ConfigureDbContextOptions(DbContextOptionsBuilder optionsBuilder);

    /// <summary>
    /// Creates a new AliasServerDbContext asynchronously.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the AliasServerDbContext.</returns>
    Task<AliasServerDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default);
}
