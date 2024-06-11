//-----------------------------------------------------------------------
// <copyright file="AuthController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AliasDb;
using AliasVault.Shared.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

/// <summary>
/// Auth controller for handling authentication.
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AliasDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly IConfiguration _configuration;

    /// <summary>
    /// Initializes a new instance of the <see cref="AuthController"/> class.
    /// </summary>
    /// <param name="context">AliasDbContext instance.</param>
    /// <param name="userManager">UserManager instance.</param>
    /// <param name="signInManager">SignInManager instance.</param>
    /// <param name="configuration">IConfiguration instance.</param>
    public AuthController(AliasDbContext context, UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IConfiguration configuration)
    {
        _context = context;
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    /// <summary>
    /// Login endpoint used to process login attempt using credentials.
    /// </summary>
    /// <param name="model">Login model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var tokenModel = await GenerateNewTokenForUser(user);
            return Ok(tokenModel);
        }

        return Unauthorized();
    }

    /// <summary>
    /// Refresh endpoint used to refresh an expired access token using a valid refresh token.
    /// </summary>
    /// <param name="tokenModel">Token model.</param>
    /// <returns>IActionResult.</returns>
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
        // Remove any existing refresh tokens for this user and device.
        var deviceIdentifier = GenerateDeviceIdentifier(Request);
        var existingToken = _context.AspNetUserRefreshTokens.Where(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier).FirstOrDefault();
        if (existingToken == null || existingToken.Value != tokenModel.RefreshToken || existingToken.ExpireDate < DateTime.Now)
        {
            return Unauthorized("Refresh token expired");
        }

        // Remove the existing refresh token.
        _context.AspNetUserRefreshTokens.Remove(existingToken);

        // Generate a new refresh token to replace the old one.
        var newRefreshToken = GenerateRefreshToken();

        // Add new refresh token.
        await _context.AspNetUserRefreshTokens.AddAsync(new AspNetUserRefreshToken
        {
            UserId = user.Id,
            DeviceIdentifier = deviceIdentifier,
            Value = newRefreshToken,
            ExpireDate = DateTime.Now.AddDays(30),
            CreatedAt = DateTime.Now,
        });
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new TokenModel() { Token = token, RefreshToken = newRefreshToken });

    }

    /// <summary>
    /// Revoke endpoint used to revoke a refresh token.
    /// </summary>
    /// <param name="model">Token model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] TokenModel model)
    {
        var principal = GetPrincipalFromExpiredToken(model.Token);
        if (principal.FindFirst(ClaimTypes.NameIdentifier)?.Value == null)
        {
            return Unauthorized("User not found (email-1)");
        }

        var user = await _userManager.FindByIdAsync(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty);
        if (user == null)
        {
            return Unauthorized("User not found (email-2)");
        }

        // Check if the refresh token is valid.
        var deviceIdentifier = GenerateDeviceIdentifier(Request);
        var existingToken = _context.AspNetUserRefreshTokens.Where(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier).FirstOrDefault();
        if (existingToken == null || existingToken.Value != model.RefreshToken)
        {
            return Unauthorized("Invalid refresh token");
        }

        // Remove the existing refresh token.
        _context.AspNetUserRefreshTokens.Remove(existingToken);
        await _context.SaveChangesAsync();

        return Ok("Refresh token revoked successfully");
    }

    /// <summary>
    /// Register endpoint used to register a new user.
    /// </summary>
    /// <param name="model">Register model.</param>
    /// <returns>IActionResult.</returns>
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
            var tokenModel = await GenerateNewTokenForUser(user);
            return Ok(tokenModel);
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
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
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
            ValidateLifetime = false,
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

    private async Task<TokenModel> GenerateNewTokenForUser(IdentityUser user)
    {
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        // Generate device identifier
        var deviceIdentifier = GenerateDeviceIdentifier(Request);

        // Save refresh token to database.
        // Remove any existing refresh tokens for this user and device.
        var existingTokens = _context.AspNetUserRefreshTokens.Where(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier);
        _context.AspNetUserRefreshTokens.RemoveRange(existingTokens);

        // Add new refresh token.
        await _context.AspNetUserRefreshTokens.AddAsync(new AspNetUserRefreshToken
        {
            UserId = user.Id,
            DeviceIdentifier = deviceIdentifier,
            Value = refreshToken,
            ExpireDate = DateTime.Now.AddDays(30),
            CreatedAt = DateTime.Now,
        });
        await _context.SaveChangesAsync();

        return new TokenModel() { Token = token, RefreshToken = refreshToken };
    }
}
