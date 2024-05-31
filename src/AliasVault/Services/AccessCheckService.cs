using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace AliasVault.Services;

public class AccessCheckService
{
    public static async Task<bool> GenericAccessCheckAsync(NavigationManager navigationManager, UserService userService)
    {
        await userService.LoadCurrentUserAsync();

        if (userService.UserLoaded)
        {
            // TODO: re-enable email confirmation check later.
            /*if (!userService.User().EmailConfirmed)
            {
                // Redirect to email confirmation page if we are not already there
                if (navigationManager.ToBaseRelativePath(navigationManager.Uri) != "account/confirm-email")
                {
                    navigationManager.NavigateTo($"account/confirm-email");
                    return false; // Halt further execution.
                }
            } */

            // User is logged in and email is confirmed.
            return true;
        }
        else
        {
            string returnUrl = navigationManager.ToBaseRelativePath(navigationManager.Uri);
            string loginUrl;

            if (string.IsNullOrEmpty(returnUrl) || returnUrl == "/" || returnUrl == "user/login")
            {
                loginUrl = "user/login";
            }
            else
            {
                loginUrl = $"user/login?returnUrl=/{Uri.EscapeDataString(returnUrl)}";
            }

            navigationManager.NavigateTo(loginUrl, true);
            return false;
        }
    }
}
