namespace AliasVault.Admin2.Services;

using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using AliasServerDb;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// User service for managing users.
/// </summary>
public class UserService
{
    private readonly AliasServerDbContext _dbContext;
    private readonly UserManager<AdminUser> _userManager;
    private readonly SignInManager<AdminUser> _signInManager;
    private AdminUser? _user;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string AdminRole = "Admin";

    /// <summary>
    /// Allow other components to subscribe to changes in the event object.
    /// </summary>
    public event Action OnChange = () => { };

    /// <summary>
    /// The roles of the current user
    /// </summary>
    private IList<string> _userRoles = new List<string>();

    /// <summary>
    /// Whether the current user is an admin or not.
    /// </summary>
    private bool _isAdmin;

    /// <summary>
    /// Gets a value indicating whether the User is loaded and available, false if not. Use this before accessing User() method.
    /// </summary>
    public bool UserLoaded => _user != null;

    private void NotifyStateChanged() => OnChange.Invoke();

    /// <summary>
    /// Initializes a new instance of the <see cref="UserService"/> class.
    /// </summary>
    /// <param name="dbContext">AliasServerDbContext instance.</param>
    /// <param name="userManager">UserManager instance.</param>
    /// <param name="signInManager">SignInManager instance.</param>
    /// <param name="httpContextAccessor">HttpContextManager instance.</param>
    public UserService(AliasServerDbContext dbContext, UserManager<AdminUser> userManager, SignInManager<AdminUser> signInManager, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _signInManager = signInManager;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Returns all users.
    /// </summary>
    /// <returns>List of users.</returns>
    public async Task<List<AdminUser>> GetAllUsersAsync()
    {
        var userList = await _userManager.Users.ToListAsync();
        return userList;
    }

    /// <summary>
    /// Finds and returns user by id, using the _userManager instead of the _dbContext.
    /// This is necessary when performing actions on the user, such as changing password or deleting the object.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>AdminUser object.</returns>
    public async Task<AdminUser> GetUserByIdUserManagerAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new Exception($"User with id {userId} not found.");
        }

        return user;
    }

    /// <summary>
    /// Returns inner User EF object.
    /// </summary>
    /// <returns></returns>
    public AdminUser User()
    {
        if (_user == null)
        {
            throw new Exception("Trying to access User object which is null.");
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
        if (_httpContextAccessor.HttpContext != null)
        {
            // Load user from database. Use a new context everytime to ensure we get the latest data.
            var user = await _dbContext.AdminUsers.FirstOrDefaultAsync(u => u.UserName == _httpContextAccessor.HttpContext.User.Identity.Name);
            if (user != null)
            {
                _user = user;

                // Load all roles for current user.
                _userRoles = await _userManager.GetRolesAsync(User());

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
        var roles = await _userManager.GetRolesAsync(User());

        return roles.ToList();
    }

    /// <summary>
    /// Search for users based on search term.
    /// </summary>
    /// <param name="searchTerm">Search term.</param>
    /// <returns>List of users matching the search term.</returns>
    public async Task<List<AdminUser>> SearchUsersAsync(string searchTerm)
    {
        return await _userManager.Users.Where(x => x.UserName.Contains(searchTerm)).Take(5).ToListAsync();
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

        var result = await _userManager.CreateAsync(user, password);
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
            var passwordRemoveResult = await _userManager.RemovePasswordAsync(user);
            if (!passwordRemoveResult.Succeeded)
            {
                foreach (var error in passwordRemoveResult.Errors)
                {
                    errors.Add(error.Description);
                }
                return errors;
            }

            var passwordAddResult = await _userManager.AddPasswordAsync(user, newPassword);
            if (!passwordAddResult.Succeeded)
            {
                foreach (var error in passwordAddResult.Errors)
                {
                    errors.Add(error.Description);
                }
                return errors;
            }
        }

        var result = await _userManager.UpdateAsync(user);
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

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (user.Id == User().Id && currentRoles.Contains(AdminRole) && !roles.Contains(AdminRole))
        {
            errors.Add("You cannot remove the Admin role from yourself if you are an Admin.");
            return errors;
        }

        var rolesToAdd = roles.Except(currentRoles).ToList();
        var rolesToRemove = currentRoles.Except(roles).ToList();

        await _userManager.AddToRolesAsync(user, rolesToAdd);
        await _userManager.RemoveFromRolesAsync(user, rolesToRemove);

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
            var originalUser = await _userManager.FindByIdAsync(user.Id);
            if (user.UserName != originalUser.UserName)
            {
                errors.Add("Username cannot be changed for existing users.");
            }
        }
        else
        {
            var existingUser = await _userManager.FindByNameAsync(user.UserName);
            if (existingUser != null)
            {
                errors.Add("Username is already in use.");
            }

            var existingEmail = await _userManager.FindByEmailAsync(user.Email);
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

    public async Task<List<string>> DeleteUserAsync(AdminUser user, bool forceDelete = false)
    {
        var errors = new List<string>();

        // Disallow deleting yourself, except when forceDelete is true
        if (user.Id == User().Id && !forceDelete)
        {
            errors.Add("You cannot delete yourself.");
            return errors;
        }

        // First delete all related data...
        // @TODO: do we not want to preserve certain anonymized data?


        // ...then delete the user
        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            // Handle error, e.g. show error messages
            errors.Add("Unable to delete user.");
        }

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

        return await _userManager.CheckPasswordAsync(user, password);
    }
}