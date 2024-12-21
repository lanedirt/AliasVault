//-----------------------------------------------------------------------
// <copyright file="IAliasServerDbContextFactory.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

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
    /// Creates a new AliasServerDbContext asynchronously.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the AliasServerDbContext.</returns>
    Task<AliasServerDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default);
}
