//-----------------------------------------------------------------------
// <copyright file="IdentityController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasGenerators.Identity.Implementations;
using AliasServerDb;
using Asp.Versioning;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Controller for identity generation.
/// </summary>
/// <param name="userManager">UserManager instance.</param>
[ApiVersion("1")]
public class IdentityController(UserManager<AliasVaultUser> userManager) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Proxies the request to the english identity generator to generate a random identity.
    /// </summary>
    /// <returns>Identity model.</returns>
    [HttpGet("Generate")]
    public async Task<IActionResult> Generate()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        var identityGenerator = new IdentityGeneratorEn();
        return Ok(await identityGenerator.GenerateRandomIdentityAsync());
    }
}
