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
using System.Text.Encodings.Web;
using AliasServerDb;
using AliasVault.Shared.Models;
using AliasVault.Shared.Models.WebApi;
using AliasVault.Shared.Models.WebApi.Auth;
using AliasVault.Shared.Providers.Time;
using Asp.Versioning;
using Cryptography.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

/// <summary>
/// Auth controller for handling authentication.
/// </summary>
/// <param name="dbContextFactory">AliasServerDbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="signInManager">SignInManager instance.</param>
/// <param name="configuration">IConfiguration instance.</param>
/// <param name="cache">IMemoryCache instance for persisting SRP values during multi-step login process.</param>
/// <param name="timeProvider">ITimeProvider instance. This returns the time which can be mutated for testing.</param>
/// <param name="urlEncoder">UrlEncoder instance.</param>
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[ApiVersion("1")]
public class AuthController(IDbContextFactory<AliasServerDbContext> dbContextFactory, UserManager<AliasVaultUser> userManager, SignInManager<AliasVaultUser> signInManager, IConfiguration configuration, IMemoryCache cache, ITimeProvider timeProvider, UrlEncoder urlEncoder) : ControllerBase
{
    /// <summary>
    /// Error message for invalid username or password.
    /// </summary>
    private static readonly string[] InvalidUsernameOrPasswordError = ["Invalid username or password. Please try again."];

    /// <summary>
    /// Error message for invalid 2-factor authentication code.
    /// </summary>
    private static readonly string[] Invalid2FaCode = ["Invalid authenticator code."];

    /// <summary>
    /// Login endpoint used to process login attempt using credentials.
    /// </summary>
    /// <param name="model">Login model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        var user = await userManager.FindByNameAsync(model.Username);
        if (user == null)
        {
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }

        // Server creates ephemeral and sends to client
        var ephemeral = Cryptography.Srp.GenerateEphemeralServer(user.Verifier);

        // Store the server ephemeral in memory cache for Validate() endpoint to use.
        cache.Set(model.Username, ephemeral.Secret, TimeSpan.FromMinutes(5));

        return Ok(new LoginResponse(user.Salt, ephemeral.Public));
    }

    /// <summary>
    /// Validate endpoint used to validate the client's proof and generate the server's proof.
    /// </summary>
    /// <param name="model">ValidateLoginRequest model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidateLoginRequest model)
    {
        var user = await userManager.FindByNameAsync(model.Username);
        if (user == null)
        {
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }

        if (!cache.TryGetValue(model.Username, out var serverSecretEphemeral) || serverSecretEphemeral is not string)
        {
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }

        try
        {
            var serverSession = Cryptography.Srp.DeriveSessionServer(
                serverSecretEphemeral.ToString() ?? string.Empty,
                model.ClientPublicEphemeral,
                user.Salt,
                model.Username,
                user.Verifier,
                model.ClientSessionProof);

            // If above does not throw an exception., then the client's proof is valid. Next check if 2FA is required.
            // If 2FA is required, return that status and no token yet.
            if (user.TwoFactorEnabled)
            {
                return Ok(new ValidateLoginResponse(true, string.Empty, null));
            }

            // If 2FA is not required, return the token immediately.
            var tokenModel = await GenerateNewTokensForUser(user);
            return Ok(new ValidateLoginResponse(false, serverSession.Proof, tokenModel));
        }
        catch
        {
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }
    }

    /// <summary>
    /// Validate login including two factor authentication code check.
    /// </summary>
    /// <param name="model">ValidateLoginRequest2Fa model.</param>
    /// <returns>Task.</returns>
    [HttpPost("validate-2fa")]
    public async Task<IActionResult> Validate2Fa([FromBody] ValidateLoginRequest2Fa model)
    {
        var user = await userManager.FindByNameAsync(model.Username);
        if (user == null)
        {
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }

        if (!cache.TryGetValue(model.Username, out var serverSecretEphemeral) || serverSecretEphemeral is not string)
        {
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }

        try
        {
            var serverSession = Cryptography.Srp.DeriveSessionServer(
                serverSecretEphemeral.ToString() ?? string.Empty,
                model.ClientPublicEphemeral,
                user.Salt,
                model.Username,
                user.Verifier,
                model.ClientSessionProof);

            // If above does not throw an exception., then the client's proof is valid. Next check 2-factor code.

            // Verify 2-factor code.
            var result = await userManager.VerifyTwoFactorTokenAsync(user, userManager.Options.Tokens.AuthenticatorTokenProvider, model.Code2Fa);

            if (!result)
            {
                return BadRequest(ServerValidationErrorResponse.Create(Invalid2FaCode, 400));
            }

            // Generate and return the JWT token.
            var tokenModel = await GenerateNewTokensForUser(user);
            return Ok(new ValidateLoginResponse(false, serverSession.Proof, tokenModel));
        }
        catch
        {
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }
    }

    /// <summary>
    /// Refresh endpoint used to refresh an expired access token using a valid refresh token.
    /// </summary>
    /// <param name="tokenModel">Token model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] TokenModel tokenModel)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

        var principal = GetPrincipalFromExpiredToken(tokenModel.Token);
        if (principal.FindFirst(ClaimTypes.NameIdentifier)?.Value == null)
        {
            return Unauthorized("User not found (name-1)");
        }

        var user = await userManager.FindByIdAsync(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty);
        if (user == null)
        {
            return Unauthorized("User not found (name-2)");
        }

        // Check if the refresh token is valid.
        // Remove any existing refresh tokens for this user and device.
        var deviceIdentifier = GenerateDeviceIdentifier(Request);
        var existingToken = context.AliasVaultUserRefreshTokens.FirstOrDefault(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier);
        if (existingToken == null || existingToken.Value != tokenModel.RefreshToken || existingToken.ExpireDate < timeProvider.UtcNow)
        {
            return Unauthorized("Refresh token expired");
        }

        // Remove the existing refresh token.
        context.AliasVaultUserRefreshTokens.Remove(existingToken);

        // Generate a new refresh token to replace the old one.
        var newRefreshToken = GenerateRefreshToken();

        // Add new refresh token.
        await context.AliasVaultUserRefreshTokens.AddAsync(new AliasVaultUserRefreshToken
        {
            UserId = user.Id,
            DeviceIdentifier = deviceIdentifier,
            Value = newRefreshToken,
            ExpireDate = timeProvider.UtcNow.AddDays(30),
            CreatedAt = timeProvider.UtcNow,
        });
        await context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new TokenModel() { Token = token, RefreshToken = newRefreshToken });
    }

    /// <summary>
    /// Enable two-factor authentication for a user.
    /// </summary>
    /// <returns>Task.</returns>
    [HttpPost("enable-2fa")]
    public async Task<IActionResult> EnableTwoFactor()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return NotFound();
        }

        var authenticatorKey = await userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(authenticatorKey))
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            authenticatorKey = await userManager.GetAuthenticatorKeyAsync(user);
        }

        var encodedKey = urlEncoder.Encode(authenticatorKey!);
        var qrCodeUrl = $"otpauth://totp/{urlEncoder.Encode("AliasVault WASM")}:{urlEncoder.Encode(user.UserName!)}?secret={encodedKey}&issuer={urlEncoder.Encode("AliasVault WASM")}";

        return Ok(new { Secret = authenticatorKey, QrCodeUrl = qrCodeUrl });
    }

    /// <summary>
    /// Verify two-factor authentication setup.
    /// </summary>
    /// <param name="code">Code to verify if 2fa successfully works.</param>
    /// <returns>Task.</returns>
    [HttpPost("verify-2fa")]
    public async Task<IActionResult> VerifyTwoFactorSetup([FromBody] string code)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return NotFound();
        }

        var isValid = await userManager.VerifyTwoFactorTokenAsync(user, userManager.Options.Tokens.AuthenticatorTokenProvider, code);

        if (isValid)
        {
            await userManager.SetTwoFactorEnabledAsync(user, true);
            return Ok();
        }
        else
        {
            return BadRequest("Invalid code.");
        }
    }

    /// <summary>
    /// Revoke endpoint used to revoke a refresh token.
    /// </summary>
    /// <param name="model">Token model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] TokenModel model)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

        var principal = GetPrincipalFromExpiredToken(model.Token);
        if (principal.FindFirst(ClaimTypes.NameIdentifier)?.Value == null)
        {
            return Unauthorized("User not found (name-1)");
        }

        var user = await userManager.FindByIdAsync(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty);
        if (user == null)
        {
            return Unauthorized("User not found (name-2)");
        }

        // Check if the refresh token is valid.
        var deviceIdentifier = GenerateDeviceIdentifier(Request);
        var existingToken = context.AliasVaultUserRefreshTokens.FirstOrDefault(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier);
        if (existingToken == null || existingToken.Value != model.RefreshToken)
        {
            return Unauthorized("Invalid refresh token");
        }

        // Remove the existing refresh token.
        context.AliasVaultUserRefreshTokens.Remove(existingToken);
        await context.SaveChangesAsync();

        return Ok("Refresh token revoked successfully");
    }

    /// <summary>
    /// Register endpoint used to register a new user.
    /// </summary>
    /// <param name="model">Register model.</param>
    /// <returns>IActionResult.</returns>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] SrpSignup model)
    {
        var user = new AliasVaultUser { UserName = model.Username, Salt = model.Salt, Verifier = model.Verifier, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var result = await userManager.CreateAsync(user);

        if (result.Succeeded)
        {
            // When a user is registered, they are automatically signed in.
            await signInManager.SignInAsync(user, isPersistent: false);

            // Return the token.
            var tokenModel = await GenerateNewTokensForUser(user);
            return Ok(tokenModel);
        }

        var errors = result.Errors.Select(e => e.Description).ToArray();
        return BadRequest(ServerValidationErrorResponse.Create(errors, 400));
    }

    /// <summary>
    /// Generate a device identifier based on request headers. This is used to associate refresh tokens
    /// with a specific device for a specific user.
    ///
    /// NOTE: current implementation means that only one refresh token can be valid for a
    /// specific user/device combo at a time. The identifier generation could be made more unique in the future
    /// to prevent any unwanted conflicts.
    /// </summary>
    /// <param name="request">The HttpRequest instance for the request that the client used.</param>
    /// <returns>Unique device identifier as string.</returns>
    private static string GenerateDeviceIdentifier(HttpRequest request)
    {
        var userAgent = request.Headers.UserAgent.ToString();
        var acceptLanguage = request.Headers.AcceptLanguage.ToString();

        var rawIdentifier = $"{userAgent}|{acceptLanguage}";
        return rawIdentifier;
    }

    /// <summary>
    /// Get the JWT key from the environment variables.
    /// </summary>
    /// <returns>JWT key as string.</returns>
    /// <exception cref="KeyNotFoundException">Thrown if environment variable does not exist.</exception>
    private static string GetJwtKey()
    {
        var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
        if (jwtKey is null)
        {
            throw new KeyNotFoundException("JWT_KEY environment variable is not set.");
        }

        return jwtKey;
    }

    /// <summary>
    /// Get the principal from an expired token. This is used to validate the token and extract the user.
    /// </summary>
    /// <param name="token">The expired token as string.</param>
    /// <returns>Claims principal.</returns>
    /// <exception cref="SecurityTokenException">Thrown if provided token is invalid.</exception>
    private static ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey())),
            ValidateLifetime = false,
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
        if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new SecurityTokenException("Invalid token");
        }

        return principal;
    }

    /// <summary>
    /// Generate a refresh token for a user. This token is used to request a new access token when the current
    /// access token expires. The refresh token is long-lived by design.
    /// </summary>
    /// <returns>Random string to be used as refresh token.</returns>
    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();

        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    /// <summary>
    /// Generate a Jwt access token for a user. This token is used to authenticate the user for a limited time
    /// and is short-lived by design. With the separate refresh token, the user can request a new access token
    /// when this access token expires.
    /// </summary>
    /// <param name="user">The user to generate the Jwt access token for.</param>
    /// <returns>Access token as string.</returns>
    private string GenerateJwtToken(AliasVaultUser user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"] ?? string.Empty,
            audience: configuration["Jwt:Issuer"] ?? string.Empty,
            claims: claims,
            expires: timeProvider.UtcNow.AddMinutes(10),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Generates a new access and refresh token for a user and persists the refresh token
    /// to the database.
    /// </summary>
    /// <param name="user">The user to generate the tokens for.</param>
    /// <returns>TokenModel which includes new access and refresh token.</returns>
    private async Task<TokenModel> GenerateNewTokensForUser(AliasVaultUser user)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        // Generate device identifier
        var deviceIdentifier = GenerateDeviceIdentifier(Request);

        // Save refresh token to database.
        // Remove any existing refresh tokens for this user and device.
        var existingTokens = context.AliasVaultUserRefreshTokens.Where(t => t.UserId == user.Id && t.DeviceIdentifier == deviceIdentifier);
        context.AliasVaultUserRefreshTokens.RemoveRange(existingTokens);

        // Add new refresh token.
        await context.AliasVaultUserRefreshTokens.AddAsync(new AliasVaultUserRefreshToken
        {
            UserId = user.Id,
            DeviceIdentifier = deviceIdentifier,
            Value = refreshToken,
            ExpireDate = timeProvider.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        return new TokenModel { Token = token, RefreshToken = refreshToken };
    }
}
