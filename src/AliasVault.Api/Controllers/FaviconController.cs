//-----------------------------------------------------------------------
// <copyright file="FaviconController.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Controllers;

using AliasServerDb;
using AliasVault.Shared.Models.WebApi.Favicon;
using Asp.Versioning;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Controller for retrieving favicons from external websites.
/// </summary>
/// <param name="userManager">UserManager instance.</param>
[ApiVersion("1")]
public class FaviconController(UserManager<AliasVaultUser> userManager) : AuthenticatedRequestController(userManager)
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
        var image = await FaviconExtractor.FaviconExtractor.GetFaviconAsync(url);

        // Return the favicon as base64 string of image representation.
        return Ok(new FaviconExtractModel { Image = image });
    }
}
