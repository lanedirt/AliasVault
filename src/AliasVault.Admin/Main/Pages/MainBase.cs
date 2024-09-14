//-----------------------------------------------------------------------
// <copyright file="MainBase.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Pages;

using AliasServerDb;
using AliasVault.Admin.Main.Models;
using AliasVault.Admin.Services;
using AliasVault.Auth;
using AliasVault.RazorComponents.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;
using Microsoft.JSInterop;

/// <summary>
/// Base authorize page that all pages that are part of the logged in website should inherit from.
/// All pages that inherit from this class will require the user to be logged in and have a confirmed email.
/// Also, a default set of breadcrumbs is added in the parent OnInitialized method.
/// </summary>
[Authorize]
public class MainBase : OwningComponentBase
{
    /// <summary>
    /// Gets or sets the NavigationService instance responsible for handling navigation, replaces the default NavigationManager.
    /// </summary>
    [Inject]
    protected NavigationService NavigationService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the UserService instance responsible for handling user data.
    /// </summary>
    [Inject]
    protected UserService UserService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the global notification service for showing notifications throughout the app.
    /// </summary>
    [Inject]
    protected GlobalNotificationService GlobalNotificationService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the JS invoke service for calling JS functions from C#.
    /// </summary>
    [Inject]
    protected JsInvokeService JsInvokeService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the AliasServerDbContext instance.
    /// </summary>
    [Inject]
    protected AliasServerDbContext DbContext { get; set; } = null!;

    /// <summary>
    /// Gets or sets the AliasServerDbContextFactory instance.
    /// </summary>
    [Inject]
    protected IDbContextFactory<AliasServerDbContext> DbContextFactory { get; set; } = null!;

    /// <summary>
    /// Gets or sets the GlobalLoadingService in order to manipulate the global loading spinner animation.
    /// </summary>
    [Inject]
    protected GlobalLoadingService GlobalLoadingSpinner { get; set; } = null!;

    /// <summary>
    /// Gets or sets the auth logging service.
    /// </summary>
    [Inject]
    protected AuthLoggingService AuthLoggingService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the confirm modal service.
    /// </summary>
    [Inject]
    protected ConfirmModalService ConfirmModalService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the injected JSRuntime instance.
    /// </summary>
    [Inject]
    protected IJSRuntime Js { get; set; } = null!;

    /// <summary>
    /// Gets the breadcrumb items for the page. A default set of breadcrumbs is added in the parent OnInitialized method.
    /// </summary>
    protected List<BreadcrumbItem> BreadcrumbItems { get; } = new();

    /// <inheritdoc />
    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();

        // Load the current user.
        await UserService.LoadCurrentUserAsync();

        // Add base breadcrumbs.
        BreadcrumbItems.Add(new BreadcrumbItem { DisplayName = "Home", Url = NavigationService.BaseUri });
    }

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);

        // Check if 2FA is enabled. If not, show a persistent notification.
        if (!UserService.User().TwoFactorEnabled)
        {
            GlobalNotificationService.AddWarningMessage("Two-factor authentication is not enabled. Please enable it in Account Settings for better security.");
        }
    }

    /// <summary>
    /// Gets the username from the authentication state asynchronously.
    /// </summary>
    /// <returns>The username.</returns>
    protected string GetUsername()
    {
        return UserService.User().UserName ?? "[Unknown]";
    }
}
