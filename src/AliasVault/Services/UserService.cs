namespace AliasVault.Services;

using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using AliasDb;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// User service for managing users.
/// </summary>
public class UserService
{
    private readonly AliasDbContext _dbContext;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private IdentityUser? _user;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string AdminRole = "Admin";

    /// <summary>
    /// The Event Ids that the current user is allowed to manage.
    /// </summary>
    private List<Guid> _managedEventIds = new();

    /// <summary>
    /// The roles of the current user
    /// </summary>
    private IList<string> _userRoles = new List<string>();

    /// <summary>
    /// Whether the current user is an admin or not.
    /// </summary>
    private bool _isAdmin;

    /// <summary>
    /// Returns true if event is loaded and available, false if not. Use this before accessing Event() method.
    /// </summary>
    public bool UserLoaded => _user != null;

    /// <summary>
    /// Allow other components to subscribe to changes in the event object.
    /// </summary>
    public event Action OnChange = delegate { };

    private void NotifyStateChanged() => OnChange.Invoke();

    public UserService(AliasDbContext dbContext, UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _signInManager = signInManager;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Returns all users.
    /// </summary>
    /// <returns></returns>
    public async Task<List<IdentityUser>> GetAllUsersAsync()
    {
        var userList = await _userManager.Users.ToListAsync();
        return userList;
    }

    /// <summary>
    /// Finds and returns user by id, using the _userManager instead of the _dbContext.
    /// This is necessary when performing actions on the user, such as changing password or deleting the object.
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<IdentityUser> GetUserByIdUserManagerAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new Exception($"User with id {userId} not found.");
        }
        return user;
    }

    /// <summary>
    /// Returns inner event EF object.
    /// </summary>
    /// <returns></returns>
    public IdentityUser User()
    {
        if (_user == null)
        {
            throw new Exception("Trying to access User object which is null.");
        }

        return _user;
    }

    /// <summary>
    /// Returns managed Event ids list.
    /// </summary>
    /// <returns></returns>
    public List<Guid> UserAllowedEventIds()
    {
        return _managedEventIds;
    }

    /// <summary>
    /// Returns whether current user is admin or not.
    /// </summary>
    /// <returns></returns>
    public bool CurrentUserIsAdmin()
    {
        return _isAdmin;
    }

    /// <summary>
    /// Returns current logged on user based on HttpContext.
    /// </summary>
    /// <returns></returns>
    public async Task LoadCurrentUserAsync()
    {
        if (_httpContextAccessor.HttpContext != null)
        {

            // Load user from database. Use a new context everytime to ensure we get the latest data.
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserName == _httpContextAccessor.HttpContext.User.Identity.Name);
            if (user != null)
            {
                _user = user;

                // Load managed event ids for current user.
                //_managedEventIds = await GetUserAllowedEventIdsAsync(_user);

                // Load all roles for current user.
                _userRoles = await _userManager.GetRolesAsync(this.User());

                // Define if current user is admin.
                _isAdmin = _userRoles.Contains(AdminRole);
            }

            // UserManager implementation: throughout Blazor server session user is not updated when user is updated in database
            // because of UserManager EF cache. That's why we load it ourselves straight from the database via new DbContext
            // to ensure we get the latest data everytime.
            /*var currentUser = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            if (currentUser != null)
            {
                _user = currentUser;

                // Load managed event ids for current user.
                _managedEventIds = await GetUserAllowedEventIdsAsync(_user);

                // Load all roles for current user.
                _userRoles = await _userManager.GetRolesAsync(User());

                // Define if current user is admin.
                _isAdmin = _userRoles.Contains(AdminRole);
            }*/
        }

        // Notify listeners that the user has been loaded.
        NotifyStateChanged();
    }

    /// <summary>
    /// Returns current logged on user based on HttpContext.
    /// </summary>
    /// <returns></returns>
    public async Task<string> GenerateEmailConfirmTokenAsync()
    {
        return await _userManager.GenerateEmailConfirmationTokenAsync(User());
    }

    /// <summary>
    /// Returns current logged on user based on HttpContext.
    /// </summary>
    /// <returns></returns>
    public async Task<IList<Claim>> GetCurrentUserClaimsAsync()
    {
        var claims = await _userManager.GetClaimsAsync(User());
        return claims;
    }

    /// <summary>
    /// Returns current logged on user based on HttpContext.
    /// </summary>
    /// <returns></returns>
    public async Task<List<string>> GetCurrentUserRolesAsync()
    {
        var roles = await _userManager.GetRolesAsync(User());

        return roles.ToList();
    }

    public async Task<List<IdentityUser>> SearchUsersAsync(string searchTerm)
    {
        return await _userManager.Users.Where(x => x.UserName.Contains(searchTerm)).Take(5).ToListAsync();
    }

    /// <summary>
    /// Sign out the current user.
    /// </summary>
    public async Task SignOutAsync()
    {
        await _signInManager.SignOutAsync();
    }

    public async Task<List<string>> CreateUserAsync(IdentityUser user, string password, List<string> roles)
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

    public async Task<List<string>> UpdateUserAsync(IdentityUser user, string newPassword)
    {
        var errors = await ValidateUser(user, newPassword, isUpdate: true);
        if (errors.Count > 0)
        {
            return errors;
        }

        // Update password if necessary
        if (!string.IsNullOrEmpty(newPassword))
        {
            var passwordRemoveResult = await this._userManager.RemovePasswordAsync(user);
            if (!passwordRemoveResult.Succeeded)
            {
                foreach (var error in passwordRemoveResult.Errors)
                {
                    errors.Add(error.Description);
                }
                return errors;
            }

            var passwordAddResult = await this._userManager.AddPasswordAsync(user, newPassword);
            if (!passwordAddResult.Succeeded)
            {
                foreach (var error in passwordAddResult.Errors)
                {
                    errors.Add(error.Description);
                }
                return errors;
            }
        }

        var result = await this._userManager.UpdateAsync(user);
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
    /// <param name="user"></param>
    /// <param name="roles"></param>
    /// <returns></returns>
    public async Task<List<string>> UpdateUserRolesAsync(IdentityUser user, List<string> roles)
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

        await this._userManager.AddToRolesAsync(user, rolesToAdd);
        await this._userManager.RemoveFromRolesAsync(user, rolesToRemove);

        return errors;
    }

    private async Task<List<string>> ValidateUser(IdentityUser user, string password, bool isUpdate)
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
            var originalUser = await this._userManager.FindByIdAsync(user.Id);
            if (user.UserName != originalUser.UserName)
            {
                errors.Add("Username cannot be changed for existing users.");
            }
        }
        else
        {
            var existingUser = await this._userManager.FindByNameAsync(user.UserName);
            if (existingUser != null)
            {
                errors.Add("Username is already in use.");
            }

            var existingEmail = await this._userManager.FindByEmailAsync(user.Email);
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

    public async Task<List<string>> DeleteUserAsync(IdentityUser user, bool forceDelete = false)
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
    /// <returns></returns>
    public async Task<bool> CheckPasswordAsync(IdentityUser user, string password)
    {
        if (password.Length == 0)
        {
            return false;
        }

        return await _userManager.CheckPasswordAsync(user, password);
    }
}
