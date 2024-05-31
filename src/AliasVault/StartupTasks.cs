namespace AliasVault;

using Microsoft.AspNetCore.Identity;

/// <summary>
/// Startup tasks that should be run when the application starts.
/// </summary>
public class StartupTasks
{
    /// <summary>
    /// Creates the roles if they do not exist.
    /// </summary>
    /// <param name="serviceProvider">IServiceProvider instance.</param>
    /// <returns>Task.</returns>
    public static async Task CreateRolesIfNotExist(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        const string adminRole = "Admin";

        if (!await roleManager.RoleExistsAsync(adminRole))
        {
            await roleManager.CreateAsync(new IdentityRole(adminRole));
        }
    }
}
