//-----------------------------------------------------------------------
// <copyright file="IAliasServerDbContextFactory.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.EntityFrameworkCore;

/// <summary>
/// The AliasServerDbContextFactory interface. This factory was primarily created to support the migration window
/// from SQLite to PostgreSQL (where both were supported). Currently only PostgreSQL is supported, so this factory
/// simply creates an instance of the now default AliasServerDbContext. This factory pattern has therefore became
/// optional and does not actually has any benefits vs. just creating the DbContext directly. But we kept it for
/// now as all clients already use this factory pattern.
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
