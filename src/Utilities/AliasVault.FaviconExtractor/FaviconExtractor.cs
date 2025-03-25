//-----------------------------------------------------------------------
// <copyright file="FaviconExtractor.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.FaviconExtractor;

using System;
using System.Net.Http;
using System.Threading.Tasks;
using HtmlAgilityPack;

/// <summary>
/// Favicon service for extracting favicons from URLs.
/// </summary>
public static class FaviconExtractor
{
    private static readonly string[] _allowedSchemes = { "http", "https" };

    /// <summary>
    /// Extracts the favicon from a URL.
    /// </summary>
    /// <param name="url">The URL to extract the favicon for.</param>
    /// <returns>Byte array for favicon image.</returns>
    public static async Task<byte[]?> GetFaviconAsync(string url)
    {
        Uri uri = new Uri(url);

        // Only allow HTTP and HTTPS schemes and default ports.
        if (!_allowedSchemes.Contains(uri.Scheme) || !uri.IsDefaultPort)
        {
            return null;
        }

        using HttpClient client = new(new HttpClientHandler
        {
            AllowAutoRedirect = true,
            MaxAutomaticRedirections = 10,
        });

        // Set a timeout for the HTTP request to prevent long-running jobs which block the client UI.
        client.Timeout = TimeSpan.FromSeconds(5);

        // Add headers to mimic a browser.
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
        client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.5");
        client.DefaultRequestHeaders.Add("Connection", "keep-alive");
        client.DefaultRequestHeaders.Add("Upgrade-Insecure-Requests", "1");

        HttpResponseMessage response = await client.GetAsync(uri);
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
                Url = node.GetAttributeValue("href", string.Empty),
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
