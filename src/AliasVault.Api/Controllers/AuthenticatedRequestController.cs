//-----------------------------------------------------------------------
// <copyright file="AuthenticatedRequestController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasVault.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Base controller for requests that require authentication.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="AuthenticatedRequestController"/> class.
/// </remarks>
/// <param name="userManager">UserManager instance.</param>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AuthenticatedRequestController(UserManager<IdentityUser> userManager) : ControllerBase
{
    /// <summary>
    /// Get the current authenticated user.
    /// </summary>
    /// <returns>IdentityUser object for current user.</returns>
    protected async Task<IdentityUser?> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new InvalidOperationException("Unable to find user ID.");
        return await userManager.FindByIdAsync(userId);
    }
}
