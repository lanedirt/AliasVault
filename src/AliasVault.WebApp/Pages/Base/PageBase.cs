//-----------------------------------------------------------------------
// <copyright file="PageBase.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Pages.Base;

using AliasVault.WebApp.Auth.Services;
using AliasVault.WebApp.Components.Models;
using AliasVault.WebApp.Services;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;

/// <summary>
/// Base authorize page that all pages that are part of the logged in website should inherit from.
/// All pages that inherit from this class will require the user to be logged in and have a confirmed email.
/// Also, a default set of breadcrumbs is added in the parent OnInitialized method.
/// </summary>
public class PageBase : OwningComponentBase
{
    private bool _parametersInitialSet;

    /// <summary>
    /// Gets or sets the NavigationManager.
    /// </summary>
    [Inject]
    public NavigationManager NavigationManager { get; set; } = null!;

    /// <summary>
    /// Gets or sets the AuthenticationStateProvider.
    /// </summary>
    [Inject]
    public AuthenticationStateProvider AuthStateProvider { get; set; } = null!;

    /// <summary>
    /// Gets or sets the GlobalNotificationService.
    /// </summary>
    [Inject]
    public GlobalNotificationService GlobalNotificationService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the IJSRuntime.
    /// </summary>
    [Inject]
    public IJSRuntime Js { get; set; } = null!;

    /// <summary>
    /// Gets or sets the AliasClientDbService.
    /// </summary>
    [Inject]
    public AliasClientDbService AliasClientDbService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the AuthService.
    /// </summary>
    [Inject]
    public AuthService AuthService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the LocalStorage.
    /// </summary>
    [Inject]
    public ILocalStorageService LocalStorage { get; set; } = null!;

    /// <summary>
    /// Gets or sets the breadcrumb items for the page. A default set of breadcrumbs is added in the parent OnInitialized method.
    /// </summary>
    protected List<BreadcrumbItem> BreadcrumbItems { get; set; } = [];

    /// <summary>
    /// Initializes the component asynchronously.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();
        _parametersInitialSet = false;

        // Add base breadcrumbs
        BreadcrumbItems.Add(new BreadcrumbItem { DisplayName = "Home", Url = NavigationManager.BaseUri });

        bool willRedirect = await RedirectIfNoEncryptionKey();
        if (willRedirect)
        {
            // Keep the page from loading if a redirect is imminent.
            while (true)
            {
                await Task.Delay(200);
            }
        }
    }

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);
        bool willRedirect = await RedirectIfNoEncryptionKey();
        if (willRedirect)
        {
            // Keep the page from loading if a redirect is imminent.
            while (true)
            {
                await Task.Delay(200);
            }
        }
    }

    /// <summary>
    /// Gets the username from the authentication state asynchronously.
    /// </summary>
    /// <returns>The username.</returns>
    protected async Task<string> GetUsernameAsync()
    {
        var authState = await AuthStateProvider.GetAuthenticationStateAsync();
        return authState.User.Identity?.Name ?? "[Unknown]";
    }

    /// <summary>
    /// Sets the parameters asynchronously.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    protected override async Task OnParametersSetAsync()
    {
        await base.OnParametersSetAsync();

        // This is to prevent the OnParametersSetAsync method from running together with OnInitialized on initial page load.
        if (!_parametersInitialSet)
        {
            _parametersInitialSet = true;
        }
    }

    /// <summary>
    /// Checks if the encryption key is set. If not, redirect to the unlock screen
    /// where the user can re-enter the master password so the encryption key gets refreshed.
    ///
    /// This method should be called on every authenticated page load.
    /// </summary>
    private async Task<bool> RedirectIfNoEncryptionKey()
    {
        // If not logged in, let the normal login process handle it.
        var authState = await AuthStateProvider.GetAuthenticationStateAsync();
        if (!authState.User.Identity?.IsAuthenticated ?? true)
        {
            return true;
        }

        // Check that encryption key is set. If not, redirect to unlock screen.
        if (!AuthService.IsEncryptionKeySet())
        {
            // If returnUrl is not set and current URL is not unlock page, set it to the current URL.
            var localStorageReturnUrl = await LocalStorage.GetItemAsync<string>("returnUrl");
            if (string.IsNullOrEmpty(localStorageReturnUrl))
            {
                var currentUrl = NavigationManager.Uri;
                if (!currentUrl.Contains("unlock"))
                {
                    await LocalStorage.SetItemAsync("returnUrl", currentUrl);
                }
            }

            NavigationManager.NavigateTo("/unlock");
            return true;
        }

        return false;
    }
}
