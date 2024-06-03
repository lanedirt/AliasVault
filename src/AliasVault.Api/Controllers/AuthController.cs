using System.Security.Cryptography;
using AliasDb;
using AliasVault.Shared.Models;

namespace AliasVault.Api.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly IConfiguration _configuration;
    private const string LoginProvider = "AliasVault";
    private const string RefreshToken = "RefreshToken";

    public AuthController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            // Generate device identifier
            var deviceIdentifier = GenerateDeviceIdentifier(Request);

            // Save refresh token to database.
            using (var dbContext = new AliasDbContext())
            {
                // Remove any existing refresh tokens for this user and device.
                var existingTokens = dbContext.AspNetUserRefreshTokens.Where(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier);
                dbContext.AspNetUserRefreshTokens.RemoveRange(existingTokens);

                // Add new refresh token.
                dbContext.AspNetUserRefreshTokens.Add(new AspNetUserRefreshTokens
                {
                    UserId = user.Id,
                    DeviceIdentifier = deviceIdentifier,
                    Value = refreshToken,
                    ExpireDate = DateTime.Now.AddDays(30),
                    CreatedAt = DateTime.Now
                });
                await dbContext.SaveChangesAsync();
            }

            await _userManager.SetAuthenticationTokenAsync(user, LoginProvider, RefreshToken, refreshToken);

            return Ok(new TokenModel() { Token = token, RefreshToken = refreshToken });
        }
        return Unauthorized();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] TokenModel tokenModel)
    {
        var principal = GetPrincipalFromExpiredToken(tokenModel.Token);
        if (principal.FindFirst(ClaimTypes.NameIdentifier)?.Value == null)
        {
            return Unauthorized("User not found (email-1)");
        }

        var user = await _userManager.FindByIdAsync(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
        if (user == null)
        {
            return Unauthorized("User not found (email-2)");
        }

        // Check if the refresh token is valid.
        using (var dbContext = new AliasDbContext())
        {
            // Remove any existing refresh tokens for this user and device.
            var deviceIdentifier = GenerateDeviceIdentifier(Request);
            var existingToken = dbContext.AspNetUserRefreshTokens.Where(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier).FirstOrDefault();
            if (existingToken == null || existingToken.Value != tokenModel.RefreshToken || existingToken.ExpireDate < DateTime.Now)
            {
                return Unauthorized("Refresh token expired");
            }

            // Remove the existing refresh token.
            dbContext.AspNetUserRefreshTokens.Remove(existingToken);

            // Generate a new refresh token to replace the old one.
            var newRefreshToken = GenerateRefreshToken();

            // Add new refresh token.
            dbContext.AspNetUserRefreshTokens.Add(new AspNetUserRefreshTokens
            {
                UserId = user.Id,
                DeviceIdentifier = deviceIdentifier,
                Value = newRefreshToken,
                ExpireDate = DateTime.Now.AddDays(30),
                CreatedAt = DateTime.Now
            });
            await dbContext.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Ok(new TokenModel() { Token = token, RefreshToken = newRefreshToken });
        }
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] TokenModel model)
    {
        var principal = GetPrincipalFromExpiredToken(model.Token);
        if (principal.FindFirst(ClaimTypes.NameIdentifier)?.Value == null)
        {
            return Unauthorized("User not found (email-1)");
        }

        var user = await _userManager.FindByIdAsync(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
        if (user == null)
        {
            return Unauthorized("User not found (email-2)");
        }

        // Check if the refresh token is valid.
        using (var dbContext = new AliasDbContext())
        {
            var deviceIdentifier = GenerateDeviceIdentifier(Request);
            var existingToken = dbContext.AspNetUserRefreshTokens.Where(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier).FirstOrDefault();
            if (existingToken == null || existingToken.Value != model.RefreshToken)
            {
                return Unauthorized("Invalid refresh token");
            }

            // Remove the existing refresh token.
            dbContext.AspNetUserRefreshTokens.Remove(existingToken);
            await dbContext.SaveChangesAsync();
        }

        return Ok("Refresh token revoked successfully");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        var user = new IdentityUser { UserName = model.Email, Email = model.Email };
        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
        {
            // When a user is registered, they are automatically signed in.
            await _signInManager.SignInAsync(user, isPersistent: false);
            // Return the token.
            var token = GenerateJwtToken(user);
            return Ok(new { token });
        }
        else
        {
            return BadRequest(result.Errors);
        }
    }

    private string GenerateJwtToken(IdentityUser user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Issuer"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }

    private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"])),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
        var jwtSecurityToken = securityToken as JwtSecurityToken;
        if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new SecurityTokenException("Invalid token");
        }

        return principal;
    }

    private string GenerateDeviceIdentifier(HttpRequest request)
    {
        // TODO: Add more headers to the device identifier or let client send a unique identifier instead.
        var userAgent = request.Headers["User-Agent"].ToString();
        var acceptLanguage = request.Headers["Accept-Language"].ToString();

        var rawIdentifier = $"{userAgent}|{acceptLanguage}";
        return rawIdentifier;
    }
}
