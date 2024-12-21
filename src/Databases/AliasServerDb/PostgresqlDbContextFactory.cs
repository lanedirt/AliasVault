//-----------------------------------------------------------------------
// <copyright file="PostgresqlDbContextFactory.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

/// <summary>
/// The AliasServerDbContextFactory interface.
/// </summary>
public class PostgresqlDbContextFactory : IAliasServerDbContextFactory
{
    private readonly IConfiguration _configuration;

    /// <summary>
    /// Initializes a new instance of the <see cref="PostgresqlDbContextFactory"/> class.
    /// </summary>
    /// <param name="configuration">The configuration.</param>
    public PostgresqlDbContextFactory(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <inheritdoc/>
    public AliasServerDbContext CreateDbContext()
    {
        var optionsBuilder = new DbContextOptionsBuilder<AliasServerDbContext>();
        var connectionString = _configuration.GetConnectionString("AliasServerDbContext");

        optionsBuilder
            .UseNpgsql(connectionString, options => options.CommandTimeout(60))
            .UseLazyLoadingProxies();

        return new AliasServerDbContextPostgresql(optionsBuilder.Options);
    }

    /// <inheritdoc/>
    public Task<AliasServerDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(CreateDbContext());
    }
}
