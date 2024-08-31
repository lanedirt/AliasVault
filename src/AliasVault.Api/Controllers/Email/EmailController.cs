//-----------------------------------------------------------------------
// <copyright file="EmailController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers.Email;

using AliasServerDb;
using AliasVault.Api.Controllers.Abstracts;
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
public class EmailController(IDbContextFactory<AliasServerDbContext> dbContextFactory, UserManager<AliasVaultUser> userManager) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Get the newest version of the vault for the current user.
    /// </summary>
    /// <param name="id">The email ID to open.</param>
    /// <returns>List of aliases in JSON format.</returns>
    [HttpGet(template: "{id}", Name = "GetEmail")]
    public async Task<IActionResult> GetEmail(int id)
    {
        await using var context = await dbContextFactory.CreateDbContextAsync();

        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized("Not authenticated.");
        }

        // Retrieve email from database.
        var email = await context.Emails.Include(x => x.EncryptionKey).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (email is null)
        {
            return NotFound("Email not found.");
        }

        // See if this user has a valid claim to the email address.
        var emailClaim = await context.UserEmailClaims
            .FirstOrDefaultAsync(x => x.UserId == user.Id && x.Address == email.To);

        if (emailClaim is null)
        {
            return Unauthorized("User does not have a claim to this email address.");
        }

        var returnEmail = new EmailApiModel
        {
            Id = email.Id,
            Subject = email.Subject,
            FromDomain = email.FromDomain,
            FromLocal = email.FromLocal,
            ToDomain = email.ToDomain,
            ToLocal = email.ToLocal,
            Date = email.Date,
            DateSystem = DateTime.SpecifyKind(email.DateSystem, DateTimeKind.Utc),
            SecondsAgo = (int)DateTime.UtcNow.Subtract(email.DateSystem).TotalSeconds,
            MessageHtml = email.MessageHtml,
            MessagePlain = email.MessagePlain,
            EncryptedSymmetricKey = email.EncryptedSymmetricKey,
            EncryptionKey = email.EncryptionKey.PublicKey,
        };

        // Add attachment metadata (without the filebytes)
        var attachments = await context.EmailAttachments.Where(x => x.EmailId == email.Id).Select(x => new AttachmentApiModel()
        {
            Id = x.Id,
            Email_Id = x.EmailId,
            Filename = x.Filename,
            MimeType = x.MimeType,
            Filesize = x.Filesize,
        }).ToListAsync();

        returnEmail.Attachments = attachments;

        return Ok(returnEmail);
    }
}
