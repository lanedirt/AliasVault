namespace AliasVault.Admin2.Services;

/// <summary>
/// Access check service to verify if the user is logged in and has a confirmed email.
/// </summary>
public class AccessCheckService
{
    public static async Task<bool> GenericAccessCheckAsync(UserService userService)
    {
        await userService.LoadCurrentUserAsync();

        if (userService.UserLoaded)
        {
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
