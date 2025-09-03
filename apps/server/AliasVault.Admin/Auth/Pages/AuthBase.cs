//-----------------------------------------------------------------------
// <copyright file="AuthBase.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Auth.Pages;

using AliasServerDb;
using AliasVault.Admin.Main.Components.Alerts;
using AliasVault.Admin.Services;
using AliasVault.Auth;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;

/// <summary>
/// Base auth page that all pages that are part of the auth (non-logged in part of website) should inherit from.
/// All pages that inherit from this class will require the user to be logged out. If user is logged in they
/// are automatically redirected to index page.
/// </summary>
public class AuthBase : OwningComponentBase
{
    /// <summary>
    /// Gets or sets the logger.
    /// </summary>
    [Inject]
    protected ILogger<Login> Logger { get; set; } = null!;

    /// <summary>
    /// Gets or sets the navigation service.
    /// </summary>
    [Inject]
    protected NavigationService NavigationService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the sign in manager.
    /// </summary>
    [Inject]
    protected SignInManager<AdminUser> SignInManager { get; set; } = null!;

    /// <summary>
    /// Gets or sets the user manager.
    /// </summary>
    [Inject]
    protected UserManager<AdminUser> UserManager { get; set; } = null!;

    /// <summary>
    /// Gets or sets the authentication state provider.
    /// </summary>
    [Inject]
    protected AuthenticationStateProvider AuthenticationStateProvider { get; set; } = null!;

    /// <summary>
    /// Gets or sets the auth logging service.
    /// </summary>
    [Inject]
    protected AuthLoggingService AuthLoggingService { get; set; } = null!;

    /// <summary>
    /// Gets or sets object which holds server validation errors to show in the UI.
    /// </summary>
    protected ServerValidationErrors ServerValidationErrors { get; set; } = new();

    /// <inheritdoc />
    protected override async Task OnInitializedAsync()
    {
        var authState = await AuthenticationStateProvider.GetAuthenticationStateAsync();
        var user = authState.User;

        // Redirect to home if the user is already authenticated
        if (SignInManager.IsSignedIn(user))
        {
            NavigationService.RedirectTo("./");
        }
    }
}
