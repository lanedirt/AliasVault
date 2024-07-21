namespace AliasVault.Admin2.Services;

using Microsoft.AspNetCore.Components;

/// <summary>
/// Access check service to verify if the user is logged in and has a confirmed email.
/// </summary>
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
            // Redirect is handled by the Main/Routes.razor file.
            return true;
        }
    }
}
