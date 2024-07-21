using AliasServerDb;
using Microsoft.AspNetCore.Identity;

namespace AliasVault.Admin2.Account;

internal sealed class IdentityUserAccessor(
    UserManager<AdminUser> userManager,
    IdentityRedirectManager redirectManager)
{
    public async Task<AdminUser> GetRequiredUserAsync(HttpContext context)
    {
        var user = await userManager.GetUserAsync(context.User);

        if (user is null)
        {
            redirectManager.RedirectToWithStatus("Account/InvalidUser",
                $"Error: Unable to load user with ID '{userManager.GetUserId(context.User)}'.", context);
        }

        return user;
    }
}
