//-----------------------------------------------------------------------
// <copyright file="RevalidatingAuthenticationStateProvider.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Auth.Providers;

using System.Security.Claims;
using AliasServerDb;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

/// <summary>
/// This is a server-side AuthenticationStateProvider that revalidates the security stamp for the connected user
/// every 30 minutes an interactive circuit is connected.
/// </summary>
/// <param name="loggerFactory">ILoggerFactory instance.</param>
/// <param name="scopeFactory">IServiceScopeFactory instance.</param>
/// <param name="options">IOptions instance.</param>
internal sealed class RevalidatingAuthenticationStateProvider(
    ILoggerFactory loggerFactory,
    IServiceScopeFactory scopeFactory,
    IOptions<IdentityOptions> options)
    : RevalidatingServerAuthenticationStateProvider(loggerFactory)
{
    /// <summary>
    /// Gets the revalidation interval.
    /// </summary>
    protected override TimeSpan RevalidationInterval => TimeSpan.FromMinutes(30);

    /// <summary>
    /// Validate the authentication state.
    /// </summary>
    /// <param name="authenticationState">AuthenticationState instance.</param>
    /// <param name="cancellationToken">CancellationToken.</param>
    /// <returns>Boolean indicating whether the currently logged on user is still valid.</returns>
    protected override async Task<bool> ValidateAuthenticationStateAsync(
        AuthenticationState authenticationState, CancellationToken cancellationToken)
    {
        // Get the user manager from a new scope to ensure it fetches fresh data
        await using var scope = scopeFactory.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AdminUser>>();
        return await ValidateSecurityStampAsync(userManager, authenticationState.User);
    }

    private async Task<bool> ValidateSecurityStampAsync(UserManager<AdminUser> userManager, ClaimsPrincipal principal)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user is null)
        {
            return false;
        }

        if (!userManager.SupportsUserSecurityStamp)
        {
            return true;
        }

        var principalStamp = principal.FindFirstValue(options.Value.ClaimsIdentity.SecurityStampClaimType);
        var userStamp = await userManager.GetSecurityStampAsync(user);
        return principalStamp == userStamp;
    }
}
