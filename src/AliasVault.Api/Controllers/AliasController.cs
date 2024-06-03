namespace AliasVault.Api.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AliasDb;
using AliasVault.Shared.Models.WebApi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Identity = AliasVault.Shared.Models.WebApi.Identity;
using Service = AliasVault.Shared.Models.WebApi.Service;

public class AliasController : AuthenticatedRequestController
{
    public AliasController(UserManager<IdentityUser> userManager) : base(userManager)
    {
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetItems()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        // Logic to retrieve items for the user.
        using (var dbContext = new AliasDbContext())
        {
            var aliases = await dbContext.Logins
                .Include(x => x.Identity)
                .Include(x => x.Service)
                .Where(x => x.UserId == user.Id)
                .Select(x => new AliasListEntry
                {
                    Id = x.Id,
                    Logo = x.Service.Logo,
                    Service = x.Service.Name,
                    CreateDate = x.CreatedAt
                })

                .ToListAsync();

            return Ok(aliases);
        }
    }

    [HttpGet("alias/{aliasId}")]
    public async Task<IActionResult> GetAlias(Guid aliasId)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        using (var dbContext = new AliasDbContext())
        {
            var aliasObject = await dbContext.Logins
                .Include(x => x.Passwords)
                .Include(x => x.Identity)
                .Include(x => x.Service)
                .Where(x => x.Id == aliasId)
                .Where(x => x.UserId == user.Id)
                .Select(x => new Alias()
                {
                    Service = new Service()
                    {
                        Name = x.Service.Name,
                        Url = x.Service.Url,
                        LogoUrl = "",
                        CreatedAt = x.Service.CreatedAt,
                        UpdatedAt = x.Service.UpdatedAt
                    },
                    Identity = new Identity()
                    {
                        FirstName = x.Identity.FirstName,
                        LastName = x.Identity.LastName,
                        AddressCity = x.Identity.AddressCity,
                        AddressState = x.Identity.AddressState,
                        AddressZipCode = x.Identity.AddressZipCode,
                        AddressCountry = x.Identity.AddressCountry,
                        Hobbies = x.Identity.Hobbies,
                        EmailPrefix = x.Identity.EmailPrefix,
                        PhoneMobile = x.Identity.PhoneMobile,
                        BankAccountIBAN = x.Identity.BankAccountIBAN,
                        CreatedAt = x.Identity.CreatedAt,
                        UpdatedAt = x.Identity.UpdatedAt
                    },
                    Password = new AliasVault.Shared.Models.WebApi.Password()
                    {
                        Value = x.Passwords.First().Value,
                        Description = "",
                        CreatedAt = x.Passwords.First().CreatedAt,
                        UpdatedAt = x.Passwords.First().UpdatedAt
                    },
                    CreateDate = x.CreatedAt,
                    LastUpdate = x.UpdatedAt

                })
                .FirstAsync();

            return Ok(aliasObject);
        }
    }
}
