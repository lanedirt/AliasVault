using AliasGenerators.Identity;
using AliasGenerators.Identity.Implementations;

namespace AliasVault.Api.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

public class IdentityController : AuthenticatedRequestController
{
    public IdentityController(UserManager<IdentityUser> userManager) : base(userManager)
    {
    }

    /// <summary>
    /// Proxies the request to the identity generator to generate a random identity.
    /// </summary>
    /// <returns></returns>
    [HttpGet("generate")]
    public async Task<IActionResult> Generate()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        IIdentityGenerator identityGenerator = new FigIdentityGenerator();
        return Ok(await identityGenerator.GenerateRandomIdentityAsync());
    }
}
