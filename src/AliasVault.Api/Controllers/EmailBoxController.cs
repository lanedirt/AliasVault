//-----------------------------------------------------------------------
// <copyright file="EmailBoxController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasServerDb;
using AliasVault.Api.Helpers;
using AliasVault.Shared.Models.Spamok;
using AliasVault.Shared.Models.WebApi;
using Asp.Versioning;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Email controller for retrieving emails from the database.
/// </summary>
/// <param name="dbContextFactory">DbContext instance.</param>
/// <param name="userManager">UserManager instance.</param>
[ApiVersion("1")]
public class EmailBoxController(IDbContextFactory<AliasServerDbContext> dbContextFactory, UserManager<AliasVaultUser> userManager) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Get the newest version of the vault for the current user.
    /// </summary>
    /// <param name="to">The full email address including @ sign.</param>
    /// <returns>List of aliases in JSON format.</returns>
    [HttpGet(template: "{to}", Name = "GetEmailBox")]
    public async Task<IActionResult> GetEmailBox(string to)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized("Not authenticated.");
        }

        // See if this user has a valid claim to the email address.
        var emailClaim = await context.UserEmailClaims
            .FirstOrDefaultAsync(x => x.Address == to);

        if (emailClaim is null)
        {
            return BadRequest(new ApiErrorResponse
            {
                Message = "No claim exists for this email address.",
                Code = "CLAIM_DOES_NOT_EXIST",
                Details = new { ProvidedEmail = to },
                StatusCode = StatusCodes.Status400BadRequest,
                Timestamp = DateTime.UtcNow,
            });
        }

        if (emailClaim.UserId != user.Id)
        {
            return BadRequest(new ApiErrorResponse
            {
                Message = "Claim does not match user.",
                Code = "CLAIM_DOES_NOT_MATCH_USER",
                Details = new { ProvidedEmail = to },
                StatusCode = StatusCodes.Status400BadRequest,
                Timestamp = DateTime.UtcNow,
            });
        }

        // Retrieve emails from database.
        List<MailboxEmailApiModel> emails = await context.Emails.AsNoTracking()
            .Where(x => x.To == to)
            .Select(x => new MailboxEmailApiModel()
            {
                Id = x.Id,
                Subject = x.Subject,
                FromDisplay = ConversionHelper.ConvertFromToFromDisplay(x.From),
                FromDomain = x.FromDomain,
                FromLocal = x.FromLocal,
                ToDomain = x.ToDomain,
                ToLocal = x.ToLocal,
                Date = x.Date,
                DateSystem = x.DateSystem,
                SecondsAgo = (int)DateTime.UtcNow.Subtract(x.DateSystem).TotalSeconds,
                MessagePreview = x.MessagePreview ?? string.Empty,
                EncryptedSymmetricKey = x.EncryptedSymmetricKey,
                EncryptionKey = x.EncryptionKey.PublicKey,
            })
            .OrderByDescending(x => x.DateSystem)
            .Take(50)
            .ToListAsync();

        MailboxApiModel returnValue = new MailboxApiModel();
        returnValue.Address = to;
        returnValue.Subscribed = false;
        returnValue.Mails = emails;

        return Ok(returnValue);
    }
}
