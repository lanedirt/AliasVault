//-----------------------------------------------------------------------
// <copyright file="IdentityController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasServerDb;
using AliasVault.Api.Controllers.Abstracts;
using AliasVault.Generators.Identity;
using AliasVault.Generators.Identity.Implementations.Factories;
using AliasVault.Generators.Identity.Models;
using Asp.Versioning;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Controller for generating identities taking into account existing information on the AliasVault server.
/// </summary>
/// <param name="userManager">UserManager instance.</param>
/// <param name="dbContextFactory">DbContextFactory instance.</param>
[ApiVersion("1")]
public class IdentityController(UserManager<AliasVaultUser> userManager, IAliasServerDbContextFactory dbContextFactory) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Generates an email prefix based on provided identity fields.
    /// </summary>
    /// <param name="firstName">First name to use for generation.</param>
    /// <param name="lastName">Last name to use for generation.</param>
    /// <param name="birthDate">Birth date to use for generation.</param>
    /// <param name="gender">Gender to use for generation (Male/Female).</param>
    /// <param name="emailDomain">Email domain to use for checking if the to be generated email address is already taken.</param>
    /// <param name="language">Two letter language code (en/nl) to use for generation.</param>
    /// <returns>Generated email prefix.</returns>
    [HttpGet("GenerateEmailPrefix")]
    public async Task<IActionResult> GenerateEmailPrefix(
        string? firstName = null,
        string? lastName = null,
        DateTime? birthDate = null,
        string? gender = null,
        string? emailDomain = null,
        string language = "en")
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        const int MaxAttempts = 10;
        string emailPrefix;
        var generator = new UsernameEmailGenerator();

        // If no identity information is provided, generate a complete random identity
        if (string.IsNullOrEmpty(firstName) && string.IsNullOrEmpty(lastName) && !birthDate.HasValue)
        {
            var identityGenerator = IdentityGeneratorFactory.CreateIdentityGenerator(language);
            var identity = await identityGenerator.GenerateRandomIdentityAsync();
            emailPrefix = identity.EmailPrefix;

            // Try up to 10 times to generate a unique email prefix
            int attempts = 1;
            while (await EmailClaimExistsAsync(emailPrefix, emailDomain) && attempts < MaxAttempts)
            {
                identity = await identityGenerator.GenerateRandomIdentityAsync();
                emailPrefix = identity.EmailPrefix;
                attempts++;
            }

            // If still not unique, try with random numbers
            if (await EmailClaimExistsAsync(emailPrefix, emailDomain))
            {
                emailPrefix = await GenerateUniqueEmailPrefixWithNumbersAsync(emailPrefix, emailDomain);
            }

            return Ok(new { emailPrefix });
        }

        // Create identity model with provided values
        var identityModel = new Identity
        {
            FirstName = firstName ?? string.Empty,
            LastName = lastName ?? string.Empty,
            BirthDate = birthDate ?? DateTime.UtcNow.AddYears(-30),
            Gender = gender?.Equals("Female", StringComparison.OrdinalIgnoreCase) == true ? Gender.Female : Gender.Male,
            NickName = string.Empty,
        };

        // Generate initial email prefix
        emailPrefix = generator.GenerateEmailPrefix(identityModel);

        // Try up to 10 times to generate a unique email prefix
        int baseAttempts = 1;
        while (await EmailClaimExistsAsync(emailPrefix, emailDomain) && baseAttempts < MaxAttempts)
        {
            emailPrefix = generator.GenerateEmailPrefix(identityModel);
            baseAttempts++;
        }

        // If still not unique, try with random numbers
        if (await EmailClaimExistsAsync(emailPrefix, emailDomain))
        {
            emailPrefix = await GenerateUniqueEmailPrefixWithNumbersAsync(emailPrefix);
        }

        return Ok(new { emailPrefix });
    }

    /// <summary>
    /// Verify that provided email address is not already taken by another user.
    /// </summary>
    /// <param name="emailPrefix">The email prefix to check.</param>
    /// <param name="emailDomain">Email domain to use for checking if the to be generated email address is already taken.</param>
    /// <returns>True if the email address is already taken, false otherwise.</returns>
    private async Task<bool> EmailClaimExistsAsync(string emailPrefix, string? emailDomain = null)
    {
        if (emailDomain == null)
        {
            // If no email domain is provided, we assume a non-aliasvault address is used which cannot be taken.
            return false;
        }

        await using var context = await dbContextFactory.CreateDbContextAsync();

        var email = emailPrefix + "@" + emailDomain;
        var claimExists = await context.UserEmailClaims.FirstOrDefaultAsync(c => c.Address == email);

        return claimExists != null;
    }

    /// <summary>
    /// Generate a unique email prefix with random numbers.
    /// </summary>
    /// <param name="basePrefix">The base prefix to use for generation.</param>
    /// <param name="emailDomain">Email domain to use for checking if the to be generated email address is already taken.</param>
    /// <returns>Unique email prefix with random numbers.</returns>
    private async Task<string> GenerateUniqueEmailPrefixWithNumbersAsync(string basePrefix, string? emailDomain = null)
    {
        if (emailDomain == null)
        {
            // If no email domain is provided, we assume a non-aliasvault address is used which cannot be taken.
            return basePrefix;
        }

        const int MaxAttempts = 10;
        var random = new Random();

        for (int i = 0; i < MaxAttempts; i++)
        {
            string prefix = $"{random.Next(10, 100)}.{basePrefix}.{random.Next(10, 100)}";
            if (!await EmailClaimExistsAsync(prefix, emailDomain))
            {
                return prefix;
            }
        }

        // If all attempts fail, return the last generated prefix
        return $"{random.Next(10, 100)}.{basePrefix}.{random.Next(10, 100)}";
    }
}
