namespace AliasVault.Admin2;

using AliasServerDb;
using Microsoft.AspNetCore.Identity;

/// <summary>
/// Startup tasks that should be run when the application starts.
/// </summary>
public static class StartupTasks
{
    /// <summary>
    /// Creates the roles if they do not exist.
    /// </summary>
    /// <param name="serviceProvider">IServiceProvider instance.</param>
    /// <returns>Task.</returns>
    public static async Task CreateRolesIfNotExist(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<AdminRole>>();

        const string adminRole = "Admin";

        if (!await roleManager.RoleExistsAsync(adminRole))
        {
            await roleManager.CreateAsync(new AdminRole(adminRole));
        }
    }

    /// <summary>
    /// Creates the admin user if it does not exist.
    /// </summary>
    /// <param name="serviceProvider"></param>
    /// <returns>Async Task.</returns>
    public static async Task SetAdminUser(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AdminUser>>();
        var adminUser = await userManager.FindByNameAsync("admin");
        var config = serviceProvider.GetRequiredService<Config>();

        if (adminUser == null)
        {
            var adminPasswordHash = config.AdminPasswordHash;
            adminUser = new AdminUser();
            adminUser.UserName = "admin";

            await userManager.CreateAsync(adminUser);
            adminUser.PasswordHash = adminPasswordHash;
            await userManager.UpdateAsync(adminUser);

            Console.WriteLine("Admin user created.");
        }
        else
        {
            // Check if the password hash is correct, if not, update it to the .env value.
            if (adminUser.PasswordHash != config.AdminPasswordHash)
            {
                if (config.LastPasswordChanged > adminUser.LastPasswordChanged)
                {
                    // The password has been changed in the .env file, update the user's password hash.
                    adminUser.PasswordHash = config.AdminPasswordHash;
                    adminUser.LastPasswordChanged = DateTime.UtcNow;

                    // Reset 2FA settings
                    adminUser.TwoFactorEnabled = false;

                    // Clear existing recovery codes
                    await userManager.GenerateNewTwoFactorRecoveryCodesAsync(adminUser, 0);

                    await userManager.UpdateAsync(adminUser);

                    Console.WriteLine("Admin password hash updated.");
                }
            }
        }
    }
}
