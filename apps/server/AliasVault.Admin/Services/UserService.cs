//-----------------------------------------------------------------------
// <copyright file="UserService.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
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
/// <param name="dbContextFactory">AliasServerDbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="httpContextAccessor">HttpContextManager instance.</param>
public class UserService(IAliasServerDbContextFactory dbContextFactory, UserManager<AdminUser> userManager, IHttpContextAccessor httpContextAccessor)
{
    private AdminUser? _user;

    /// <summary>
    /// Allow other components to subscribe to changes in the event object.
    /// </summary>
    public event Action OnChange = () => { };

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
    /// Returns current logged on user based on HttpContext.
    /// </summary>
    /// <returns>Async task.</returns>
    public async Task LoadCurrentUserAsync()
    {
        if (httpContextAccessor.HttpContext != null)
        {
            // Load user from database. Use a new context everytime to ensure we get the latest data.
            var userName = httpContextAccessor.HttpContext?.User.Identity?.Name ?? string.Empty;

            await using var dbContext = await dbContextFactory.CreateDbContextAsync();
            var user = await dbContext.AdminUsers.FirstOrDefaultAsync(u => u.UserName == userName);
            if (user != null)
            {
                _user = user;
            }
        }

        // Notify listeners that the user has been loaded.
        NotifyStateChanged();
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
