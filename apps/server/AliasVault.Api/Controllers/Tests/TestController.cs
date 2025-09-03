//-----------------------------------------------------------------------
// <copyright file="TestController.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

/*
 * Note: this file is used for E2E testing purposes only. It contains test endpoints that are called by pages on
 * the client for testing purposes. Because certain endpoints that simulate exceptions are prone to Denial-Of-Service
 * attack surfaces we don't include this file in the production build.
 */

namespace AliasVault.Api.Controllers.Tests;

using AliasServerDb;
using AliasVault.Api.Controllers.Abstracts;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Test controller that contains test endpoints called by pages on the client for E2E testing purposes.
/// </summary>
/// <param name="userManager">UserManager instance.</param>
[ApiVersion("1")]
public class TestController(UserManager<AliasVaultUser> userManager) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Authenticated test request.
    /// </summary>
    /// <returns>Static OK.</returns>
    [HttpGet("")]
    public IActionResult TestCall()
    {
        return Ok();
    }

    /// <summary>
    /// Test request that throws an exception. Used for testing error handling.
    /// </summary>
    /// <returns>Static OK.</returns>
    [AllowAnonymous]
    [HttpGet("Error")]
    public IActionResult TestCallError()
    {
        // Throw an exception here to test error handling.
        throw new ArgumentException("Test error");
    }
}
