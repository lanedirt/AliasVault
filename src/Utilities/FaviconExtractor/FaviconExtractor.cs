//-----------------------------------------------------------------------
// <copyright file="FaviconExtractor.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace FaviconExtractor;

using System;
using System.Net.Http;
using System.Threading.Tasks;
using HtmlAgilityPack;

/// <summary>
/// Favicon service for extracting favicons from URLs.
/// </summary>
public static class FaviconExtractor
{
    /// <summary>
    /// Extracts the favicon from a URL.
    /// </summary>
    /// <param name="url">The URL to extract the favicon for.</param>
    /// <returns>Byte array for favicon image.</returns>
    public static async Task<byte[]?> GetFaviconAsync(string url)
    {
        using HttpClient client = new();
        HttpResponseMessage response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        string htmlContent = await response.Content.ReadAsStringAsync();
        HtmlDocument htmlDoc = new();
        htmlDoc.LoadHtml(htmlContent);

        // Find all favicon links in the HTML
        var faviconNodes = htmlDoc.DocumentNode.SelectNodes("//link[contains(@rel, 'icon')]");
        if (faviconNodes == null || faviconNodes.Count == 0)
        {
            return null;
        }

        // Extract favicon URLs and their sizes
        var favicons = faviconNodes
            .Select(node => new
            {
                Url = node.GetAttributeValue("href", null),
                Size = GetFaviconSize(node.GetAttributeValue("sizes", "0x0")),
            })
            .Where(favicon => !string.IsNullOrEmpty(favicon.Url))
            .OrderByDescending(favicon => favicon.Size)
            .ToList();

        if (favicons.Count == 0)
        {
            return null;
        }

        var bestFavicon = favicons[0];
        var faviconUrl = bestFavicon.Url;

        // If the favicon URL is relative, convert it to an absolute URL
        if (!Uri.IsWellFormedUriString(faviconUrl, UriKind.Absolute))
        {
            var baseUri = new Uri(url);
            faviconUrl = new Uri(baseUri, faviconUrl).ToString();
        }

        HttpResponseMessage faviconResponse = await client.GetAsync(faviconUrl);
        if (!faviconResponse.IsSuccessStatusCode)
        {
            return null;
        }

        byte[] faviconBytes = await faviconResponse.Content.ReadAsByteArrayAsync();
        return faviconBytes;
    }

    /// <summary>
    /// Gets the size of a favicon from a size string.
    /// </summary>
    /// <param name="size">Size string.</param>
    /// <returns>Int which represent pixel count of image size.</returns>
    private static int GetFaviconSize(string size)
    {
        if (string.IsNullOrEmpty(size) || size == "any")
        {
            return 0;
        }

        var sizeParts = size.Split('x');
        if (sizeParts.Length == 2 &&
            int.TryParse(sizeParts[0], out int width) &&
            int.TryParse(sizeParts[1], out int height))
        {
            return width * height;
        }

        return 0;
    }
}
