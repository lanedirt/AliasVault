//-----------------------------------------------------------------------
// <copyright file="AuthenticatedRequestController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AliasVault.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AuthenticatedRequestController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;

    public AuthenticatedRequestController(UserManager<IdentityUser> userManager)
    {
        _userManager = userManager;
    }

    protected async Task<IdentityUser?> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _userManager.FindByIdAsync(userId);
    }
}
