using AliasServerDb;
using Microsoft.AspNetCore.Authorization;

namespace AliasVault.Admin2.Main.Pages;

using AliasVault.Admin2.Main.Models;
using AliasVault.Admin2.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

/// <summary>
/// Base authorize page that all pages that are part of the logged in website should inherit from.
/// All pages that inherit from this class will require the user to be logged in and have a confirmed email.
/// Also, a default set of breadcrumbs is added in the parent OnInitialized method.
/// </summary>
[Authorize]
public class MainBase : OwningComponentBase
{
    private bool _parametersInitialSet;

    [Inject]
    public NavigationManager NavigationManager { get; set; } = null!;

    [Inject]
    protected UserService UserService { get; set; } = null!;

    [Inject]
    protected GlobalNotificationService GlobalNotificationService { get; set; } = null!;

    [Inject]
    public JsInvokeService JsInvokeService { get; set; } = null!;

    [Inject]
    public AliasServerDbContext DbContext { get; set; } = null!;

    [Inject]
    public IJSRuntime Js { get; set; } = null!;

    /// <summary>
    /// Contains the breadcrumb items for the page. A default set of breadcrumbs is added in the parent OnInitialized method.
    /// </summary>
    protected List<BreadcrumbItem> BreadcrumbItems { get; set; } = new List<BreadcrumbItem>();

    protected override async Task OnInitializedAsync()
    {
        if (!await AccessCheck())
        {
            return;
        }

        await base.OnInitializedAsync();
        _parametersInitialSet = false;

        // Add base breadcrumbs
        BreadcrumbItems.Add(new BreadcrumbItem { DisplayName = "Home", Url = NavigationManager.BaseUri });

        // Call the GenericAccessCheckAsync method and halt execution if a redirect is required.
        var verifyAccessCheckTask = await AccessCheckService.GenericAccessCheckAsync(NavigationManager, UserService);
        if (verifyAccessCheckTask != true)
        {
            // Keep the page from loading if the user is not authorized by calling an infinite loop.
            // We wait for navigation to happen during the infinite loop.
            while (true)
            {
                await Task.Delay(1000);
            }
        }
    }

    /// <inheritdoc />
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);
    }

    /// <summary>
    /// Issue a redirect to the login page if the user is not logged in.
    /// </summary>
    /// <returns>Boolean whether user has access to the current page.</returns>
    protected async Task<bool> AccessCheck()
    {
        // Call the GenericAccessCheckAsync method and halt execution if a redirect is required.
        var verifyAccessCheckTask = await AccessCheckService.GenericAccessCheckAsync(NavigationManager, UserService);
        if (verifyAccessCheckTask != true)
        {
            // Keep the page from loading if the user is not authorized by calling an infinite loop.
            // We wait for navigation to happen during the infinite loop.
            while (true)
            {
                await Task.Delay(1000);
                return false;
            }
        }

        return true;
    }

    protected override async Task OnParametersSetAsync()
    {
        await base.OnParametersSetAsync();

        // This is needed to prevent the OnParametersSetAsync method from running together with OnInitialized on initial page load.
        if (!_parametersInitialSet)
        {
            _parametersInitialSet = true;
            return;
        }

        // Call the GenericAccessCheckAsync method and halt execution if a redirect is required.
        var verifyAccessCheckTask = await AccessCheckService.GenericAccessCheckAsync(NavigationManager, UserService);
        if (verifyAccessCheckTask != true)
        {
            // Keep the page from loading if the user is not authorized by calling an infinite loop.
            // We wait for navigation to happen during the infinite loop.
            while (true)
            {
                await Task.Delay(1000);
            }
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
