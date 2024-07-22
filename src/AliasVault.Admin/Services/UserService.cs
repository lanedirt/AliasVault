//-----------------------------------------------------------------------
// <copyright file="UserService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Services;

using System.ComponentModel.DataAnnotations;
using AliasServerDb;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// User service for managing users.
/// </summary>
/// <param name="dbContext">AliasServerDbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="httpContextAccessor">HttpContextManager instance.</param>
public class UserService(AliasServerDbContext dbContext, UserManager<AdminUser> userManager, IHttpContextAccessor httpContextAccessor)
{
    private const string AdminRole = "Admin";
    private AdminUser? _user;

    /// <summary>
    /// The roles of the current user.
    /// </summary>
    private List<string> _userRoles = [];

    /// <summary>
    /// Whether the current user is an admin or not.
    /// </summary>
    private bool _isAdmin;

    /// <summary>
    /// Allow other components to subscribe to changes in the event object.
    /// </summary>
    public event Action OnChange = () => { };

    /// <summary>
    /// Gets a value indicating whether the User is loaded and available, false if not. Use this before accessing User() method.
    /// </summary>
    public bool UserLoaded => _user != null;

    /// <summary>
    /// Returns all users.
    /// </summary>
    /// <returns>List of users.</returns>
    public async Task<List<AdminUser>> GetAllUsersAsync()
    {
        var userList = await userManager.Users.ToListAsync();
        return userList;
    }

    /// <summary>
    /// Finds and returns user by id, using the userManager instead of the dbContext.
    /// This is necessary when performing actions on the user, such as changing password or deleting the object.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>AdminUser object.</returns>
    public async Task<AdminUser> GetUserByIdUserManagerAsync(Guid userId)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new ArgumentException($"User with id {userId} not found.");
        }

        return user;
    }

    /// <summary>
    /// Returns inner User EF object.
    /// </summary>
    /// <returns>User object.</returns>
    public AdminUser User()
    {
        if (_user == null)
        {
            throw new ArgumentException("Trying to access User object which is null.");
        }

        return _user;
    }

    /// <summary>
    /// Returns whether current user is admin or not.
    /// </summary>
    /// <returns>Boolean which indicates if user is admin.</returns>
    public bool CurrentUserIsAdmin()
    {
        return _isAdmin;
    }

    /// <summary>
    /// Returns current logged on user based on HttpContext.
    /// </summary>
    /// <returns>Async task.</returns>
    public async Task LoadCurrentUserAsync()
    {
        if (httpContextAccessor.HttpContext != null)
        {
            // Load user from database. Use a new context everytime to ensure we get the latest data.
            var userName = httpContextAccessor.HttpContext?.User?.Identity?.Name ?? string.Empty;

            var user = await dbContext.AdminUsers.FirstOrDefaultAsync(u => u.UserName == userName);
            if (user != null)
            {
                _user = user;

                // Load all roles for current user.
                var roles = await userManager.GetRolesAsync(User());
                _userRoles = roles.ToList();

                // Define if current user is admin.
                _isAdmin = _userRoles.Contains(AdminRole);
            }
        }

        // Notify listeners that the user has been loaded.
        NotifyStateChanged();
    }

    /// <summary>
    /// Returns current logged on user roles based on HttpContext.
    /// </summary>
    /// <returns>List of roles.</returns>
    public async Task<List<string>> GetCurrentUserRolesAsync()
    {
        var roles = await userManager.GetRolesAsync(User());

        return roles.ToList();
    }

    /// <summary>
    /// Search for users based on search term.
    /// </summary>
    /// <param name="searchTerm">Search term.</param>
    /// <returns>List of users matching the search term.</returns>
    public async Task<List<AdminUser>> SearchUsersAsync(string searchTerm)
    {
        return await userManager.Users.Where(x => x.UserName != null && x.UserName.Contains(searchTerm)).Take(5).ToListAsync();
    }

    /// <summary>
    /// Create a new user.
    /// </summary>
    /// <param name="user">User object.</param>
    /// <param name="password">Password.</param>
    /// <param name="roles">Roles.</param>
    /// <returns>List of errors if there are any.</returns>
    public async Task<List<string>> CreateUserAsync(AdminUser user, string password, List<string> roles)
    {
        var errors = await ValidateUser(user, password, isUpdate: false);
        if (errors.Count > 0)
        {
            return errors;
        }

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                errors.Add(error.Description);
            }

            return errors;
        }

        errors = await UpdateUserRolesAsync(user, roles);

        return errors;
    }

    /// <summary>
    /// Update user.
    /// </summary>
    /// <param name="user">User object.</param>
    /// <param name="newPassword">Optional parameter for new password for the user.</param>
    /// <returns>List of errors if any.</returns>
    public async Task<List<string>> UpdateUserAsync(AdminUser user, string newPassword = "")
    {
        var errors = await ValidateUser(user, newPassword, isUpdate: true);
        if (errors.Count > 0)
        {
            return errors;
        }

        // Update password if necessary
        if (!string.IsNullOrEmpty(newPassword))
        {
            var passwordRemoveResult = await userManager.RemovePasswordAsync(user);
            if (!passwordRemoveResult.Succeeded)
            {
                foreach (var error in passwordRemoveResult.Errors)
                {
                    errors.Add(error.Description);
                }

                return errors;
            }

            var passwordAddResult = await userManager.AddPasswordAsync(user, newPassword);
            if (!passwordAddResult.Succeeded)
            {
                foreach (var error in passwordAddResult.Errors)
                {
                    errors.Add(error.Description);
                }

                return errors;
            }
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                errors.Add(error.Description);
            }

            return errors;
        }

        return errors;
    }

    /// <summary>
    /// Update user roles. This is a separate method because it is called from both CreateUserAsync and UpdateUserAsync.
    /// </summary>
    /// <param name="user">User object.</param>
    /// <param name="roles">New roles for the user.</param>
    /// <returns>List of errors if any.</returns>
    public async Task<List<string>> UpdateUserRolesAsync(AdminUser user, List<string> roles)
    {
        List<string> errors = new();

        var currentRoles = await userManager.GetRolesAsync(user);
        if (user.Id == User().Id && currentRoles.Contains(AdminRole) && !roles.Contains(AdminRole))
        {
            errors.Add("You cannot remove the Admin role from yourself if you are an Admin.");
            return errors;
        }

        var rolesToAdd = roles.Except(currentRoles).ToList();
        var rolesToRemove = currentRoles.Except(roles).ToList();

        await userManager.AddToRolesAsync(user, rolesToAdd);
        await userManager.RemoveFromRolesAsync(user, rolesToRemove);

        return errors;
    }

    /// <summary>
    /// Checks if supplied password is correct for the user.
    /// </summary>
    /// <param name="user">User object.</param>
    /// <param name="password">The password to check.</param>
    /// <returns>Boolean indicating whether supplied password is valid and matches what is stored in the database..</returns>
    public async Task<bool> CheckPasswordAsync(AdminUser user, string password)
    {
        if (password.Length == 0)
        {
            return false;
        }

        return await userManager.CheckPasswordAsync(user, password);
    }

    /// <summary>
    /// Validate if user object contents conform to the requirements.
    /// </summary>
    /// <param name="user">User object.</param>
    /// <param name="password">Password for the user.</param>
    /// <param name="isUpdate">Boolean indicating whether the user is being updated or not.</param>
    /// <returns>List of strings.</returns>
    private async Task<List<string>> ValidateUser(AdminUser user, string password, bool isUpdate)
    {
        // Username and email are the same, so enforce any changes to username here to email as well
        user.Email = user.UserName;

        var errors = new List<string>();

        if (string.IsNullOrEmpty(user.UserName) || string.IsNullOrEmpty(user.Email))
        {
            errors.Add("Username and email are required.");
            return errors;
        }

        if (!new EmailAddressAttribute().IsValid(user.Email))
        {
            errors.Add("Email is not valid.");
            return errors;
        }

        if (isUpdate)
        {
            var originalUser = await userManager.FindByIdAsync(user.Id);
            if (originalUser != null && user.UserName != originalUser.UserName)
            {
                errors.Add("Username cannot be changed for existing users.");
            }
        }
        else
        {
            var existingUser = await userManager.FindByNameAsync(user.UserName);
            if (existingUser != null)
            {
                errors.Add("Username is already in use.");
            }

            var existingEmail = await userManager.FindByEmailAsync(user.Email);
            if (existingEmail != null)
            {
                errors.Add("Email is already in use.");
            }

            if (string.IsNullOrEmpty(password))
            {
                errors.Add("Password is required.");
            }
        }

        return errors;
    }

    private void NotifyStateChanged() => OnChange.Invoke();
}
