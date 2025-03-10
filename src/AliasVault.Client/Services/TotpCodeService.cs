//-----------------------------------------------------------------------
// <copyright file="TotpCodeService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using AliasClientDb;
using AliasVault.Client.Services.Database;
using AliasVault.TotpGenerator;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Service for managing TOTP codes.
/// </summary>
public class TotpCodeService
{
    private readonly DbService _dbService;
    private readonly ILogger<TotpCodeService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="TotpCodeService"/> class.
    /// </summary>
    /// <param name="dbService">The database service.</param>
    /// <param name="logger">The logger.</param>
    public TotpCodeService(DbService dbService, ILogger<TotpCodeService> logger)
    {
        _dbService = dbService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the remaining seconds until the TOTP code expires.
    /// </summary>
    /// <param name="step">The time step in seconds. Default is 30.</param>
    /// <returns>The remaining seconds.</returns>
    public int GetRemainingSeconds(int step = 30)
    {
        var unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return step - (int)(unixTimestamp % step);
    }
}
