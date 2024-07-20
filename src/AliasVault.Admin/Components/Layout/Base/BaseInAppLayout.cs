using AliasVault.Admin.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AliasVault.Components.Layouts.Base;

/// <summary>
/// Checks whether the current event has the Faqs plugin enabled. If not, user is redirected
/// to the plugin disabled page.
/// </summary>
public class BaseInAppLayout : LayoutComponentBase
{
    [Inject]
    public JsInvokeService JsInvokeService { get; set; } = null!;

    [Inject]
    public NavigationManager NavigationManager { get; set; } = null!;

    [Inject]
    public UserService UserService { get; set; } = null!;

    protected bool AccessCheckCompleted;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // Call the GenericAccessCheckAsync method and halt execution if a redirect is required.
            AccessCheckCompleted = await AccessCheckService.GenericAccessCheckAsync(NavigationManager, UserService);
            StateHasChanged();

            // Active main theme init logic (darkmode, menu toggle)
            await JsInvokeService.RetryInvokeAsync("mainThemeInit", TimeSpan.FromMilliseconds(200), 5);
        }
    }

}
