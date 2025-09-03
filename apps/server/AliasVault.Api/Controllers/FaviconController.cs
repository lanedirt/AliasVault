//-----------------------------------------------------------------------
// <copyright file="FaviconController.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasServerDb;
using AliasVault.Api.Controllers.Abstracts;
using AliasVault.Shared.Models.WebApi.Favicon;
using Asp.Versioning;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Controller for retrieving favicons from external websites.
/// </summary>
/// <param name="userManager">UserManager instance.</param>
/// <param name="logger">Logger instance.</param>
[ApiVersion("1")]
public class FaviconController(UserManager<AliasVaultUser> userManager, ILogger<FaviconController> logger) : AuthenticatedRequestController(userManager)
{
    /// <summary>
    /// Proxies the request to the identity generator to generate a random identity.
    /// </summary>
    /// <param name="url">URL to extract the favicon from.</param>
    /// <returns>Identity model.</returns>
    [HttpGet("Extract")]
    public async Task<IActionResult> Extract(string url)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            return Unauthorized();
        }

        // Get the favicon from the URL.
        try
        {
            var image = await FaviconExtractor.FaviconExtractor.GetFaviconAsync(url);

            // Return the favicon as base64 string of image representation.
            return Ok(new FaviconExtractModel { Image = image });
        }
        catch (Exception ex)
        {
            // Anonymize the URL by replacing all a-Z characters with 'x' before logging.
            // This will still allow to see the host structure but not the actual domain.
            var anonymizedUrl = new string(url.Select(c => char.IsLetter(c) ? 'x' : c).ToArray());
            logger.LogInformation(ex, "Failed to extract favicon from {Url}", anonymizedUrl);
        }

        // Return null if favicon extraction failed.
        return Ok(new FaviconExtractModel { Image = null });
    }
}
