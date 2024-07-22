namespace AliasVault.Admin2.Auth.Pages;

using AliasServerDb;
using AliasVault.Admin2.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;

/// <summary>
/// Base auth page that all pages that are part of the auth (non-logged in part of website) should inherit from.
/// All pages that inherit from this class will require the user to be logged out. If user is logged in they
/// are automatically redirected to index page.
/// </summary>
[Authorize]
public class AuthBase : OwningComponentBase
{
    [Inject]
    protected SignInManager<AdminUser> SignInManager { get; set; } = null!;
    
    [Inject]
    protected UserManager<AdminUser> UserManager { get; set; } = null!;

    [Inject]
    protected AuthenticationStateProvider AuthenticationStateProvider { get; set; } = null!;

    [Inject]
    public ILogger<Login> Logger { get; set; } = null!;

    [Inject]
    public NavigationService NavigationService { get; set; } = null!;

    /// <inheritdoc />
    protected override async Task OnInitializedAsync()
    {
        var authState = await AuthenticationStateProvider.GetAuthenticationStateAsync();
        var user = authState.User;

        // Redirect to home if the user is already authenticated
        if (SignInManager.IsSignedIn(user))
        {
            NavigationService.RedirectTo("/");
        }
    }
}
