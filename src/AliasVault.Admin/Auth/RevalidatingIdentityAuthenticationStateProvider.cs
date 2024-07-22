namespace AliasVault.Admin.Auth;

using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

/// <summary>
/// Revalidating identity authentication state provider.
/// </summary>
/// <typeparam name="TUser">The user object.</typeparam>
public class RevalidatingIdentityAuthenticationStateProvider<TUser>
    : RevalidatingServerAuthenticationStateProvider
    where TUser : class
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IdentityOptions _options;

    /// <summary>
    /// Initializes a new instance of the <see cref="RevalidatingIdentityAuthenticationStateProvider{TUser}"/> class.
    /// </summary>
    /// <param name="loggerFactory">ILoggerFactory instance.</param>
    /// <param name="scopeFactory">IServiceScopeFactory instance.</param>
    /// <param name="optionsAccessor">IOptions instance.</param>
    public RevalidatingIdentityAuthenticationStateProvider(
        ILoggerFactory loggerFactory,
        IServiceScopeFactory scopeFactory,
        IOptions<IdentityOptions> optionsAccessor)
        : base(loggerFactory)
    {
        _scopeFactory = scopeFactory;
        _options = optionsAccessor.Value;
    }

    /// <summary>
    /// The revalidation interval.
    /// </summary>
    protected override TimeSpan RevalidationInterval => TimeSpan.FromMinutes(30);

    /// <summary>
    /// Validate the authentication state.
    /// </summary>
    /// <param name="authenticationState">AuthenticationState instance.</param>
    /// <param name="cancellationToken">CancellationToken.</param>
    /// <returns>Boolean indicating whether the currently logged on user is still valid.</returns>
    protected override async Task<bool> ValidateAuthenticationStateAsync(
        AuthenticationState authenticationState, CancellationToken cancellationToken)
    {
        // Get the user manager from a new scope to ensure it fetches fresh data
        var scope = _scopeFactory.CreateScope();
        try
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<TUser>>();
            return await ValidateSecurityStampAsync(userManager, authenticationState.User);
        }
        finally
        {
            if (scope is IAsyncDisposable asyncDisposable)
            {
                await asyncDisposable.DisposeAsync();
            }
            else
            {
                scope.Dispose();
            }
        }
    }

    private async Task<bool> ValidateSecurityStampAsync(UserManager<TUser> userManager, ClaimsPrincipal principal)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user == null)
        {
            return false;
        }
        else if (!userManager.SupportsUserSecurityStamp)
        {
            return true;
        }
        else
        {
            var principalStamp = principal.FindFirstValue(_options.ClaimsIdentity.SecurityStampClaimType);
            var userStamp = await userManager.GetSecurityStampAsync(user);
            return principalStamp == userStamp;
        }
    }
}
