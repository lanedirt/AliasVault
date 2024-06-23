//-----------------------------------------------------------------------
// <copyright file="RootController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Root controller that contains health check endpoints.
/// </summary>
[ApiController]
[Route("/")]
public class RootController : ControllerBase
{
    /// <summary>
    /// Root endpoint that returns a 200 OK if the database connection is successful
    /// and the DB migrations are up-to-date.
    /// </summary>
    /// <returns>Http 200 if database connection is successful.</returns>
    [HttpGet]
    [ProducesResponseType<int>(StatusCodes.Status200OK)]
    [ProducesResponseType<int>(StatusCodes.Status500InternalServerError)]
    public IActionResult Get()
    {
        try
        {
            using (var dbContext = new AliasDbContext())
            {
                var appliedMigrations = dbContext.Database.GetAppliedMigrations();
                var allMigrations = dbContext.Database.GetMigrations();

                if (allMigrations.Except(appliedMigrations).Any())
                {
                    // There are pending migrations
                    return StatusCode(500, "There are pending migrations. Please run 'dotnet ef database update' to apply them.");
                }

                // Database is up to date
                return Ok("OK");
            }
        }
        catch
        {
            return StatusCode(500, "Internal server error");
        }
    }
}
