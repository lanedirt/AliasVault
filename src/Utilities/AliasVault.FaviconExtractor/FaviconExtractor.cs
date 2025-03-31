//-----------------------------------------------------------------------
// <copyright file="FaviconExtractor.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.FaviconExtractor;

using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using HtmlAgilityPack;
using SkiaSharp;

/// <summary>
/// Favicon service for extracting favicons from URLs.
/// </summary>
public static class FaviconExtractor
{
    private const int MaxSizeBytes = 50 * 1024; // 50KB max size before resizing
    private const int TargetWidth = 96; // Resize target width
    private static readonly string[] _allowedSchemes = { "http", "https" };

    /// <summary>
    /// Extracts the favicon from a URL.
    /// </summary>
    /// <param name="url">The URL to extract the favicon for.</param>
    /// <returns>Byte array for favicon image.</returns>
    public static async Task<byte[]?> GetFaviconAsync(string url)
    {
        // Add URL normalization - if no scheme is provided, try with https://
        if (!url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            url = "https://" + url;
        }

        Uri uri = new(url);

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

        // Find all favicon links in the HTML with priority order
        var faviconNodes = new[]
        {
            // SVG icons
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and @type='image/svg+xml']"),

            // Large icons
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and (@sizes='192x192' or @sizes='128x128')]"),

            // Apple touch icons
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='apple-touch-icon' or @rel='apple-touch-icon-precomposed']"),

            // Standard icons
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' or @rel='shortcut icon']"),
        };

        // Add default favicon.ico as fallback
        var defaultFavicon = new HtmlNode(HtmlNodeType.Element, htmlDoc, 0);
        defaultFavicon.Attributes.Add("href", $"{uri.GetLeftPart(UriPartial.Authority)}/favicon.ico");
        faviconNodes = faviconNodes.Append(new HtmlNodeCollection(htmlDoc.DocumentNode) { defaultFavicon }).ToArray();

        foreach (var nodeCollection in faviconNodes)
        {
            if (nodeCollection == null || nodeCollection.Count == 0)
            {
                continue;
            }

            foreach (var node in nodeCollection)
            {
                var faviconUrl = node.GetAttributeValue("href", string.Empty);
                if (string.IsNullOrEmpty(faviconUrl))
                {
                    continue;
                }

                // If the favicon URL is relative, convert it to an absolute URL
                if (!Uri.IsWellFormedUriString(faviconUrl, UriKind.Absolute))
                {
                    faviconUrl = new Uri(uri, faviconUrl).ToString();
                }

                var faviconBytes = await FetchAndProcessFaviconAsync(client, faviconUrl);
                if (faviconBytes != null)
                {
                    return faviconBytes;
                }
            }
        }

        return null;
    }

    private static async Task<byte[]?> FetchAndProcessFaviconAsync(HttpClient client, string url)
    {
        try
        {
            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var contentType = response.Content.Headers.ContentType?.MediaType;
            if (string.IsNullOrEmpty(contentType) || !contentType.StartsWith("image/"))
            {
                return null;
            }

            var imageBytes = await response.Content.ReadAsByteArrayAsync();
            if (imageBytes.Length == 0)
            {
                return null;
            }

            // If image is too large, attempt to resize
            if (imageBytes.Length > MaxSizeBytes)
            {
                var resizedBytes = ResizeImageAsync(imageBytes, contentType);
                if (resizedBytes != null)
                {
                    imageBytes = resizedBytes;
                }
            }

            // Return only if within size limits
            return imageBytes.Length <= MaxSizeBytes ? imageBytes : null;
        }
        catch
        {
            return null;
        }
    }

    private static byte[]? ResizeImageAsync(byte[] imageBytes, string contentType)
    {
        try
        {
            using var original = SKBitmap.Decode(imageBytes);
            if (original == null)
            {
                return null;
            }

            var scale = (float)TargetWidth / original.Width;
            var targetHeight = (int)(original.Height * scale);

            using var resized = original.Resize(new SKImageInfo(TargetWidth, targetHeight), new SKSamplingOptions(SKFilterMode.Linear));
            if (resized == null)
            {
                return null;
            }

            using var image = SKImage.FromBitmap(resized);
            var format = contentType switch
            {
                "image/png" => SKEncodedImageFormat.Png,
                "image/jpeg" => SKEncodedImageFormat.Jpeg,
                "image/gif" => SKEncodedImageFormat.Gif,
                _ => SKEncodedImageFormat.Png,
            };

            var data = image.Encode(format, 90);
            return data?.ToArray();
        }
        catch
        {
            return null;
        }
    }
}
