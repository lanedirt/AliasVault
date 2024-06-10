namespace AliasVault.Api.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AliasDb;
using AliasVault.Shared.Models.WebApi;
using Microsoft.EntityFrameworkCore;
using Identity = AliasVault.Shared.Models.WebApi.Identity;
using Service = AliasVault.Shared.Models.WebApi.Service;

public class AliasController : AuthenticatedRequestController
{
    private readonly AliasDbContext _context;

    public AliasController(AliasDbContext context, UserManager<IdentityUser> userManager) : base(userManager)
    {
        _context = context;
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
        var aliases = await _context.Logins
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

    [HttpGet("{aliasId}")]
    public async Task<IActionResult> GetAlias(Guid aliasId)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        var aliasObject = await _context.Logins
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
                    NickName = x.Identity.NickName,
                    FirstName = x.Identity.FirstName,
                    LastName = x.Identity.LastName,
                    BirthDate = x.Identity.BirthDate.ToString("yyyy-MM-dd"),
                    Gender = x.Identity.Gender,
                    AddressStreet = x.Identity.AddressStreet,
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
                    Value = x.Passwords.First().Value ?? "",
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

    /// <summary>
    /// Insert a new entry to the database.
    /// </summary>
    /// <param name="model"></param>
    /// <returns></returns>
    [HttpPut("")]
    public async Task<IActionResult> Insert([FromBody] Alias model)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        var login = new Login();
        login.UserId = user.Id;
        login.CreatedAt = DateTime.UtcNow;
        login.UpdatedAt = DateTime.UtcNow;
        login.Identity = new AliasDb.Identity()
        {
            NickName = model.Identity.NickName,
            FirstName = model.Identity.FirstName,
            LastName = model.Identity.LastName,
            BirthDate = DateTime.Parse(model.Identity.BirthDate),
            Gender = model.Identity.Gender,
            AddressStreet = model.Identity.AddressStreet,
            AddressCity = model.Identity.AddressCity,
            AddressState = model.Identity.AddressState,
            AddressZipCode = model.Identity.AddressZipCode,
            AddressCountry = model.Identity.AddressCountry,
            Hobbies = model.Identity.Hobbies,
            EmailPrefix = model.Identity.EmailPrefix,
            PhoneMobile = model.Identity.PhoneMobile,
            BankAccountIBAN = model.Identity.BankAccountIBAN,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        login.Passwords.Add(new AliasDb.Password()
        {
            Value = model.Password.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        login.Service = new AliasDb.Service()
        {
            Name = model.Service.Name,
            Url = model.Service.Url,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Logins.Add(login);
        await _context.SaveChangesAsync();

        return Ok(login.Id);
    }

    /// <summary>
    /// Update an existing entry in the database.
    /// </summary>
    /// <param name="model"></param>
    /// <param name="aliasId"></param>
    /// <returns></returns>
    [HttpPost("{aliasId}")]
    public async Task<IActionResult> Update([FromBody] Alias model, Guid aliasId)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        // Get the existing entry.
        var login = await _context.Logins
            .Include(x => x.Identity)
            .Include(x => x.Service)
            .Include(x => x.Passwords)
            .Where(x => x.Id == aliasId)
            .Where(x => x.UserId == user.Id)
            .FirstAsync();

        login.UpdatedAt = DateTime.UtcNow;
        login.Identity.NickName = model.Identity.NickName;
        login.Identity.FirstName = model.Identity.FirstName;
        login.Identity.LastName = model.Identity.LastName;
        login.Identity.BirthDate = DateTime.Parse(model.Identity.BirthDate);
        login.Identity.Gender = model.Identity.Gender;
        login.Identity.AddressStreet = model.Identity.AddressStreet;
        login.Identity.AddressCity = model.Identity.AddressCity;
        login.Identity.AddressState = model.Identity.AddressState;
        login.Identity.AddressZipCode = model.Identity.AddressZipCode;
        login.Identity.AddressCountry = model.Identity.AddressCountry;
        login.Identity.Hobbies = model.Identity.Hobbies;
        login.Identity.EmailPrefix = model.Identity.EmailPrefix;
        login.Identity.PhoneMobile = model.Identity.PhoneMobile;
        login.Identity.BankAccountIBAN = model.Identity.BankAccountIBAN;

        login.Passwords.First().Value = model.Password.Value;
        login.Passwords.First().UpdatedAt = DateTime.UtcNow;

        login.Service.Name = model.Service.Name;
        login.Service.Url = model.Service.Url;
        login.Service.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(login.Id);
    }

    /// <summary>
    /// Delete an existing entry from the database.
    /// </summary>
    /// <param name="aliasId"></param>
    [HttpDelete("{aliasId}")]
    public async Task<IActionResult> Delete(Guid aliasId)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        var login = await _context.Logins
            .Where(x => x.Id == aliasId)
            .Where(x => x.UserId == user.Id)
            .FirstAsync();

        _context.Logins.Remove(login);
        await _context.SaveChangesAsync();

        return Ok();
    }
}
