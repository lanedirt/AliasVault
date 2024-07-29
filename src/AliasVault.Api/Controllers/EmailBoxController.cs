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
            .FirstOrDefaultAsync(x => x.UserId == user.Id && x.Address == to);

        if (emailClaim is null)
        {
            return Unauthorized("User does not have a claim to this email address.");
        }

        // Retrieve emails from database.
        List<MailboxEmailApiModel> emails = context.Emails.AsNoTracking().Select(x => new MailboxEmailApiModel()
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
        }).OrderByDescending(x => x.DateSystem).Take(75).ToList();

        MailboxApiModel returnValue = new MailboxApiModel();
        returnValue.Address = to;
        returnValue.Subscribed = false;
        returnValue.Mails = emails;

        return Ok(returnValue);
    }
}
