using AliasVault.Admin.Models;
using AliasVault.Admin.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.JSInterop;

namespace AliasVault.Admin.Components.Pages;

/// <summary>
/// Base authorize page that all pages that are part of the logged in website should inherit from.
/// All pages that inherit from this class will require the user to be logged in and have a confirmed email.
/// Also, a default set of breadcrumbs is added in the parent OnInitialized method.
/// </summary>
public class AuthorizePageBase : OwningComponentBase
{
    [Inject]
    public NavigationManager NavigationManager { get; set; } = null!;
    [Inject]
    protected UserService UserService { get; set; } = null!;
    [Inject]
    protected PortalMessageService PortalMessageService { get; set; } = null!;

    [Inject]
    public JsInvokeService JsInvokeService { get; set; } = null!;

    [Inject]
    public IJSRuntime Js { get; set; } = null!;

    /// <summary>
    /// Contains the breadcrumb items for the page. A default set of breadcrumbs is added in the parent OnInitialized method.
    /// </summary>
    protected List<BreadcrumbItem> BreadcrumbItems { get; set; } = new List<BreadcrumbItem>();

    private bool _parametersInitialSet;

    protected override async Task OnInitializedAsync()
    {
        if (!await AccessCheck()) return;
        await base.OnInitializedAsync();
        _parametersInitialSet = false;

        // Add base breadcrumbs
        BreadcrumbItems.Add(new BreadcrumbItem { DisplayName = "Home", Url = NavigationManager.BaseUri });

        // Detect success messages in query string and add them to the SuccessMessages list
        var uri = new Uri(NavigationManager.Uri);
        PortalMessageService.RetrieveMessagesFromQueryString(uri);

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
    /// Issue a redirect to the login page if the user is not logged in.
    /// </summary>
    /// <returns></returns>
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
}
