//-----------------------------------------------------------------------
// <copyright file="SqliteDbContextFactory.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

/// <summary>
/// The AliasServerDbContextFactory interface.
/// </summary>
public class SqliteDbContextFactory : IAliasServerDbContextFactory
{
    private readonly IConfiguration _configuration;

    /// <summary>
    /// Initializes a new instance of the <see cref="SqliteDbContextFactory"/> class.
    /// </summary>
    /// <param name="configuration">The configuration.</param>
    public SqliteDbContextFactory(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <inheritdoc/>
    public void ConfigureDbContextOptions(DbContextOptionsBuilder optionsBuilder)
    {
        var connectionString = _configuration.GetConnectionString("AliasServerDbContext") +
                             ";Mode=ReadWriteCreate;Cache=Shared";

        optionsBuilder
            .UseSqlite(connectionString, options => options.CommandTimeout(60))
            .UseLazyLoadingProxies();
    }

    /// <inheritdoc/>
    public AliasServerDbContext CreateDbContext()
    {
        var optionsBuilder = new DbContextOptionsBuilder<AliasServerDbContext>();
        ConfigureDbContextOptions(optionsBuilder);
        return new AliasServerDbContextSqlite(optionsBuilder.Options);
    }

    /// <inheritdoc/>
    public Task<AliasServerDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(CreateDbContext());
    }
}
