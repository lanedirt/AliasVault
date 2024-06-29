//-----------------------------------------------------------------------
// <copyright file="TestController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasServerDb;
using Asp.Versioning;
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
    /// <returns>List of aliases in JSON format.</returns>
    [HttpGet("")]
    public IActionResult TestCall()
    {
        return Ok();
    }
}
