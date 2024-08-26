//-----------------------------------------------------------------------
// <copyright file="TwoFactorAuthController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using System.Text.Encodings.Web;
using AliasServerDb;
using Asp.Versioning;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Auth controller for handling authentication.
/// </summary>
/// <param name="dbContextFactory">AliasServerDbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
/// <param name="urlEncoder">UrlEncoder instance.</param>
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[ApiVersion("1")]
public class TwoFactorAuthController(IDbContextFactory<AliasServerDbContext> dbContextFactory, UserManager<AliasVaultUser> userManager, UrlEncoder urlEncoder) : ControllerBase
{
    /// <summary>
    /// Get two-factor authentication enabled status for a user.
    /// </summary>
    /// <returns>Task.</returns>
    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return NotFound();
        }

        var twoFactorEnabled = await userManager.GetTwoFactorEnabledAsync(user);
        return Ok(new { TwoFactorEnabled = twoFactorEnabled });
    }

    /// <summary>
    /// Enable two-factor authentication for a user.
    /// </summary>
    /// <returns>Task.</returns>
    [HttpPost("enable")]
    public async Task<IActionResult> Enable()
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
        var qrCodeUrl = $"otpauth://totp/{urlEncoder.Encode("AliasVault")}:{urlEncoder.Encode(user.UserName!)}?secret={encodedKey}&issuer={urlEncoder.Encode("AliasVault")}";

        return Ok(new { Secret = authenticatorKey, QrCodeUrl = qrCodeUrl });
    }

    /// <summary>
    /// Disable two-factor authentication for a user.
    /// </summary>
    /// <returns>Task.</returns>
    [HttpPost("disable")]
    public async Task<IActionResult> Disable()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return NotFound();
        }

        await using var context = await dbContextFactory.CreateDbContextAsync();

        // Disable 2FA and remove any existing authenticator key(s) and recovery codes.
        await userManager.SetTwoFactorEnabledAsync(user, false);
        context.UserTokens.RemoveRange(
            context.UserTokens.Where(
                x => x.UserId == user.Id &&
                     (x.Name == "AuthenticatorKey" || x.Name == "RecoveryCodes")).ToList());

        await context.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Verify two-factor authentication setup.
    /// </summary>
    /// <param name="code">Code to verify if 2fa successfully works.</param>
    /// <returns>Task.</returns>
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] string code)
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

            // Generate new recovery codes.
            var recoveryCodes = await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);

            return Ok(new { RecoveryCodes = recoveryCodes });
        }

        return BadRequest("Invalid code.");
    }
}
