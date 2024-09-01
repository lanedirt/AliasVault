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
using AliasServerDb;
using AliasVault.AuthLogging;
using AliasVault.Shared.Models.Enums;
using AliasVault.Shared.Models.WebApi;
using AliasVault.Shared.Models.WebApi.Auth;
using AliasVault.Shared.Providers.Time;
using Asp.Versioning;
using Cryptography.Client;
using Cryptography.Client.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using SecureRemotePassword;

/// <summary>
/// Auth controller for handling authentication.
/// </summary>
/// <param name="dbContextFactory">AliasServerDbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="signInManager">SignInManager instance.</param>
/// <param name="configuration">IConfiguration instance.</param>
/// <param name="cache">IMemoryCache instance for persisting SRP values during multi-step login process.</param>
/// <param name="timeProvider">ITimeProvider instance. This returns the time which can be mutated for testing.</param>
/// <param name="authLoggingService">AuthLoggingService instance. This is used to log auth attempts to the database.</param>
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[ApiVersion("1")]
public class AuthController(IDbContextFactory<AliasServerDbContext> dbContextFactory, UserManager<AliasVaultUser> userManager, SignInManager<AliasVaultUser> signInManager, IConfiguration configuration, IMemoryCache cache, ITimeProvider timeProvider, AuthLoggingService authLoggingService) : ControllerBase
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
    /// Error message for invalid 2-factor authentication recovery code.
    /// </summary>
    private static readonly string[] InvalidRecoveryCode = ["Invalid recovery code."];

    /// <summary>
    /// Error message for invalid 2-factor authentication recovery code.
    /// </summary>
    private static readonly string[] AccountLocked = ["You have entered an incorrect password too many times and your account has now been locked out. You can try again in 30 minutes.."];

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
            await authLoggingService.LogAuthEventFailAsync(model.Username, AuthEventType.Login, AuthFailureReason.InvalidUsername);
            return BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400));
        }

        // Check if the account is locked out
        if (await userManager.IsLockedOutAsync(user))
        {
            await authLoggingService.LogAuthEventFailAsync(model.Username, AuthEventType.TwoFactorAuthentication, AuthFailureReason.AccountLocked);
            return BadRequest(ServerValidationErrorResponse.Create(AccountLocked, 400));
        }

        // Server creates ephemeral and sends to client
        var ephemeral = Srp.GenerateEphemeralServer(user.Verifier);

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
        var (user, serverSession, error) = await ValidateUserAndPassword(model);
        if (error is not null)
        {
            // Error occured during validation, return the error.
            return error;
        }

        await authLoggingService.LogAuthEventSuccessAsync(model.Username, AuthEventType.Login);

        // If 2FA is required, return that status and no JWT token yet.
        if (user!.TwoFactorEnabled)
        {
            return Ok(new ValidateLoginResponse(true, string.Empty, null));
        }

        // If 2FA is not required, then it means the user is successfully authenticated at this point.

        // Reset failed login attempts.
        await userManager.ResetAccessFailedCountAsync(user!);

        var tokenModel = await GenerateNewTokensForUser(user);
        return Ok(new ValidateLoginResponse(false, serverSession!.Proof, tokenModel));
    }

    /// <summary>
    /// Validate login including two-factor authentication code check.
    /// </summary>
    /// <param name="model">ValidateLoginRequest2Fa model.</param>
    /// <returns>Task.</returns>
    [HttpPost("validate-2fa")]
    public async Task<IActionResult> Validate2Fa([FromBody] ValidateLoginRequest2Fa model)
    {
        var (user, serverSession, error) = await ValidateUserAndPassword(model);
        if (error is not null)
        {
            // Error occured during validation, return the error.
            return error;
        }

        // Verify 2-factor code.
        var verifyResult = await userManager.VerifyTwoFactorTokenAsync(user!, userManager.Options.Tokens.AuthenticatorTokenProvider, model.Code2Fa);
        if (!verifyResult)
        {
            // Increment failed login attempts in order to lock out the account when the limit is reached.
            await userManager.AccessFailedAsync(user!);

            await authLoggingService.LogAuthEventFailAsync(model.Username, AuthEventType.TwoFactorAuthentication, AuthFailureReason.InvalidTwoFactorCode);
            return BadRequest(ServerValidationErrorResponse.Create(Invalid2FaCode, 400));
        }

        // Validation of 2-FA token is successful, user is authenticated.
        await authLoggingService.LogAuthEventSuccessAsync(model.Username, AuthEventType.TwoFactorAuthentication);

        // Reset failed login attempts.
        await userManager.ResetAccessFailedCountAsync(user!);

        // Generate and return the JWT token.
        var tokenModel = await GenerateNewTokensForUser(user!);
        return Ok(new ValidateLoginResponse(false, serverSession!.Proof, tokenModel));
    }

    /// <summary>
    /// Validate login including two-factor authentication recovery code check.
    /// </summary>
    /// <param name="model">ValidateLoginRequestRecoveryCode model.</param>
    /// <returns>Task.</returns>
    [HttpPost("validate-recovery-code")]
    public async Task<IActionResult> ValidateRecoveryCode([FromBody] ValidateLoginRequestRecoveryCode model)
    {
        var (user, serverSession, error) = await ValidateUserAndPassword(model);
        if (error is not null)
        {
            // Error occured during validation, return the error.
            return error;
        }

        // Sanitize recovery code.
        var recoveryCode = model.RecoveryCode.Replace(" ", string.Empty).ToUpper();

        // Attempt to redeem the recovery code
        var redeemResult = await userManager.RedeemTwoFactorRecoveryCodeAsync(user!, recoveryCode);

        if (!redeemResult.Succeeded)
        {
            // Increment failed login attempts in order to lock out the account when the limit is reached.
            await userManager.AccessFailedAsync(user!);

            await authLoggingService.LogAuthEventFailAsync(model.Username, AuthEventType.TwoFactorAuthentication, AuthFailureReason.InvalidRecoveryCode);
            return BadRequest(ServerValidationErrorResponse.Create(InvalidRecoveryCode, 400));
        }

        // Recovery code is valid, user is authenticated.
        await authLoggingService.LogAuthEventSuccessAsync(model.Username, AuthEventType.TwoFactorAuthentication);

        // Reset failed login attempts.
        await userManager.ResetAccessFailedCountAsync(user!);

        // Generate and return the JWT token.
        var tokenModel = await GenerateNewTokensForUser(user!);
        return Ok(new ValidateLoginResponse(false, serverSession!.Proof, tokenModel));
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

        var principal = GetPrincipalFromToken(tokenModel.Token);
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
        if (existingToken == null || existingToken.Value != tokenModel.RefreshToken || existingToken.ExpireDate < timeProvider.UtcNow)
        {
            await authLoggingService.LogAuthEventFailAsync(user.UserName!, AuthEventType.TokenRefresh, AuthFailureReason.InvalidRefreshToken);
            return Unauthorized("Refresh token expired");
        }

        // Remove the existing refresh token.
        context.AliasVaultUserRefreshTokens.Remove(existingToken);

        // Generate a new refresh token to replace the old one.
        var newRefreshToken = GenerateRefreshToken();

        // Add new refresh token.
        context.AliasVaultUserRefreshTokens.Add(new AliasVaultUserRefreshToken
        {
            UserId = user.Id,
            DeviceIdentifier = deviceIdentifier,
            Value = newRefreshToken,
            ExpireDate = timeProvider.UtcNow.AddDays(30),
            CreatedAt = timeProvider.UtcNow,
        });
        await context.SaveChangesAsync();

        await authLoggingService.LogAuthEventSuccessAsync(user.UserName!, AuthEventType.TokenRefresh);
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
        await using var context = await dbContextFactory.CreateDbContextAsync();

        var principal = GetPrincipalFromToken(model.Token);
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
            await authLoggingService.LogAuthEventFailAsync(user.UserName!, AuthEventType.Logout, AuthFailureReason.InvalidRefreshToken);
            return Unauthorized("Invalid refresh token");
        }

        // Remove the existing refresh token.
        context.AliasVaultUserRefreshTokens.Remove(existingToken);
        await context.SaveChangesAsync();

        await authLoggingService.LogAuthEventSuccessAsync(user.UserName!, AuthEventType.Logout);
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
        // Validate username, disallow "admin" as a username.
        if (string.Equals(model.Username, "admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ServerValidationErrorResponse.Create(["Username 'admin' is not allowed."], 400));
        }

        var user = new AliasVaultUser { UserName = model.Username, Salt = model.Salt, Verifier = model.Verifier, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var result = await userManager.CreateAsync(user);

        if (result.Succeeded)
        {
            await authLoggingService.LogAuthEventSuccessAsync(model.Username, AuthEventType.Register);

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
    /// Get the principal from a token. This is used to validate the token and extract the user.
    /// </summary>
    /// <param name="token">The token as string.</param>
    /// <returns>Claims principal.</returns>
    /// <exception cref="SecurityTokenException">Thrown if provided token is invalid.</exception>
    private static ClaimsPrincipal GetPrincipalFromToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey())),

            // We don't validate the token lifetime here, as we only use it for refresh tokens.
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
    /// Validates the user and SRP session (password). If the user is not found or the password is invalid an
    /// action result is returned with the appropriate error message. If everything is valid nothing is returned.
    /// </summary>
    /// <param name="model">ValidateLoginRequest model.</param>
    /// <returns>User and SrpSession object if validation succeeded, IActionResult as error on error.</returns>
    private async Task<(AliasVaultUser? User, SrpSession? ServerSession, IActionResult? Error)> ValidateUserAndPassword(ValidateLoginRequest model)
    {
        var user = await userManager.FindByNameAsync(model.Username);
        if (user == null)
        {
            await authLoggingService.LogAuthEventFailAsync(model.Username, AuthEventType.Login, AuthFailureReason.InvalidUsername);
            return (null, null, BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400)));
        }

        // Check if the account is locked out
        if (await userManager.IsLockedOutAsync(user))
        {
            await authLoggingService.LogAuthEventFailAsync(model.Username, AuthEventType.TwoFactorAuthentication, AuthFailureReason.AccountLocked);
            return (null, null, BadRequest(ServerValidationErrorResponse.Create(AccountLocked, 400)));
        }

        // Validate the SRP session (actual password check).
        var serverSession = await ValidateSrpSession(model.Username, model.ClientPublicEphemeral, model.ClientSessionProof);
        if (serverSession is null)
        {
            // Increment failed login attempts in order to lock out the account when the limit is reached.
            await userManager.AccessFailedAsync(user);

            await authLoggingService.LogAuthEventFailAsync(model.Username, AuthEventType.Login, AuthFailureReason.InvalidPassword);
            return (null, null, BadRequest(ServerValidationErrorResponse.Create(InvalidUsernameOrPasswordError, 400)));
        }

        return (user, serverSession, null);
    }

    /// <summary>
    /// Helper method that validates the SRP session based on provided username, ephemeral and proof.
    /// </summary>
    /// <param name="username">The username.</param>
    /// <param name="clientEphemeral">The client ephemeral value.</param>
    /// <param name="clientSessionProof">The client session proof.</param>
    /// <returns>Tuple.</returns>
    private async Task<SrpSession?> ValidateSrpSession(string username, string clientEphemeral, string clientSessionProof)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user == null)
        {
            return null;
        }

        if (!cache.TryGetValue(username, out var serverSecretEphemeral) || serverSecretEphemeral is not string)
        {
            return null;
        }

        var serverSession = Srp.DeriveSessionServer(
            serverSecretEphemeral.ToString() ?? string.Empty,
            clientEphemeral,
            user.Salt,
            username,
            user.Verifier,
            clientSessionProof);

        if (serverSession is null)
        {
            return null;
        }

        return serverSession;
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
        context.AliasVaultUserRefreshTokens.Add(new AliasVaultUserRefreshToken
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
