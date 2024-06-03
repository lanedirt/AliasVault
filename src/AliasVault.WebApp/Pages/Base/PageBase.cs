using AliasVault.WebApp.Components.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AliasVault.WebApp.Pages.Base;

/// <summary>
/// Base authorize page that all pages that are part of the logged in website should inherit from.
/// All pages that inherit from this class will require the user to be logged in and have a confirmed email.
/// Also, a default set of breadcrumbs is added in the parent OnInitialized method.
/// </summary>
public class PageBase : OwningComponentBase
{
    [Inject]
    public NavigationManager NavigationManager { get; set; } = null!;

    [Inject]
    public IJSRuntime Js { get; set; } = null!;

    /// <summary>
    /// Contains the breadcrumb items for the page. A default set of breadcrumbs is added in the parent OnInitialized method.
    /// </summary>
    protected List<BreadcrumbItem> BreadcrumbItems { get; set; } = new List<BreadcrumbItem>();

    private bool _parametersInitialSet;

    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();
        _parametersInitialSet = false;

        // Add base breadcrumbs
        BreadcrumbItems.Add(new BreadcrumbItem { DisplayName = "Home", Url = NavigationManager.BaseUri });

        // Detect success messages in query string and add them to the SuccessMessages list
        var uri = new Uri(NavigationManager.Uri);
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
    }
}
