using System.Security.Claims;
using AliasServerDb;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace AliasVault.Admin.Identity;

public class ClaimsTransformer : IClaimsTransformation
{
    private readonly IDbContextFactory<AliasServerDbContext> _dbContextFactory;

    public ClaimsTransformer(IDbContextFactory<AliasServerDbContext> dbContextFactory)
    {
        _dbContextFactory = dbContextFactory;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        // Check if the user is authenticated
        if (!principal.Identity?.IsAuthenticated ?? false)
        {
            return principal;
        }

        using (var dbContext = await _dbContextFactory.CreateDbContextAsync())
        {
            // Get the user
            var user = await dbContext.AdminUsers.FirstOrDefaultAsync(u => u.UserName == principal.Identity.Name);

            if (user == null)
            {
                return principal;
            }

            // Get the user's roles and claims in a single database call
            var userRolesAndClaims = await (
                from userRole in dbContext.AdminUserRoles
                join role in dbContext.AdminRoles on userRole.RoleId equals role.Id
                where userRole.UserId == user.Id
                select new { userRole, role }
            ).ToListAsync();

            var userClaims = await dbContext.AdminUserClaims.Where(x => x.UserId == user.Id).ToListAsync();

            // Convert roles to claims
            var roleClaims = userRolesAndClaims
                .Select(uc => new Claim(ClaimTypes.Role, uc.role.Name))
                .ToList();

            // Add the user's claims to the role claims
            foreach (var userClaim in userClaims)
            {
                roleClaims.Add(new Claim(userClaim.ClaimType, userClaim.ClaimValue));
            }

            // Filter out the role claims from the original claims, and use that to append to the new identity
            HashSet<string> roleTypesToRemove = new HashSet<string>
            {
                ClaimTypes.Role,
                //EventPermissionHandler.EventPermissionClaimType,
            };
            var nonRoleClaims = principal.Claims.Where(c => !roleTypesToRemove.Contains(c.Type));

            // Create new identity and return it
            var identity = new ClaimsIdentity(
                nonRoleClaims.Concat(roleClaims),
                principal.Identity.AuthenticationType,
                ClaimTypes.Name,
                ClaimTypes.Role
            );

            return new ClaimsPrincipal(identity);
        }
    }
}
