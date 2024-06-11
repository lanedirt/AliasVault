//-----------------------------------------------------------------------
// <copyright file="IdentityController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasVault.Api.Controllers;

using AliasGenerators.Identity;
using AliasGenerators.Identity.Implementations;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Controller for identity generation.
/// </summary>
public class IdentityController : AuthenticatedRequestController
{
    /// <summary>
    /// Initializes a new instance of the <see cref="IdentityController"/> class.
    /// </summary>
    /// <param name="userManager">UserManager instance.</param>
    public IdentityController(UserManager<IdentityUser> userManager) : base(userManager)
    {
    }

    /// <summary>
    /// Proxies the request to the identity generator to generate a random identity.
    /// </summary>
    /// <returns></returns>
    [HttpGet("generate")]
    public async Task<IActionResult> Generate()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        IIdentityGenerator identityGenerator = new FigIdentityGenerator();
        return Ok(await identityGenerator.GenerateRandomIdentityAsync());
    }
}
