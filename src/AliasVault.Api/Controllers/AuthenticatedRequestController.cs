using Microsoft.AspNetCore.Authorization;

namespace AliasVault.Api.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AuthenticatedRequestController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;

    public AuthenticatedRequestController(UserManager<IdentityUser> userManager)
    {
        _userManager = userManager;
    }

    protected async Task<IdentityUser?> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _userManager.FindByIdAsync(userId);
    }
}
