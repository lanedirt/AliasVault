//-----------------------------------------------------------------------
// <copyright file="FaviconExtractor.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
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
        url = NormalizeUrl(url);
        Uri uri = new(url);

        if (!IsValidUri(uri))
        {
            return null;
        }

        using HttpClient client = CreateHttpClient();

        // First attempt
        var result = await TryGetFaviconAsync(client, uri);
        if (result != null)
        {
            return result;
        }

        return await TryGetFaviconAsync(client, uri);
    }

    /// <summary>
    /// Normalizes the URL by adding a scheme if it is missing.
    /// </summary>
    /// <param name="url">The URL to normalize.</param>
    /// <returns>The normalized URL.</returns>
    private static string NormalizeUrl(string url)
    {
        if (!url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return "https://" + url;
        }

        return url;
    }

    /// <summary>
    /// Checks if the URI is valid.
    /// </summary>
    /// <param name="uri">The URI to check.</param>
    /// <returns>True if the URI is valid, false otherwise.</returns>
    private static bool IsValidUri(Uri uri)
    {
        return _allowedSchemes.Contains(uri.Scheme) && uri.IsDefaultPort;
    }

    /// <summary>
    /// Creates a new HTTP client with default headers.
    /// </summary>
    /// <returns>The HTTP client.</returns>
    private static HttpClient CreateHttpClient()
    {
        var client = new HttpClient(new HttpClientHandler
        {
            AllowAutoRedirect = true,
            MaxAutomaticRedirections = 10,
        })
        {
            Timeout = TimeSpan.FromSeconds(5),
        };

        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
        client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.5");
        client.DefaultRequestHeaders.Add("Connection", "keep-alive");
        client.DefaultRequestHeaders.Add("Upgrade-Insecure-Requests", "1");

        return client;
    }

    /// <summary>
    /// Gets the favicon nodes from the HTML.
    /// </summary>
    /// <param name="response">The response to get the favicon nodes from.</param>
    /// <param name="uri">The URI to get the favicon nodes from.</param>
    /// <returns>The favicon nodes.</returns>
    private static async Task<HtmlNodeCollection[]> GetFaviconNodesFromHtml(HttpResponseMessage response, Uri uri)
    {
        string htmlContent = await response.Content.ReadAsStringAsync();
        HtmlDocument htmlDoc = new();
        htmlDoc.LoadHtml(htmlContent);

        var defaultFavicon = new HtmlNode(HtmlNodeType.Element, htmlDoc, 0);
        defaultFavicon.Attributes.Add("href", $"{uri.GetLeftPart(UriPartial.Authority)}/favicon.ico");

        HtmlNodeCollection?[] nodeArray =
        [
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and @type='image/svg+xml']"),
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and @sizes='96x96']"),
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and @sizes='128x128']"),
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and @sizes='48x48']"),
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and @sizes='32x32']"),
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' and @sizes='192x192']"),
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='apple-touch-icon' or @rel='apple-touch-icon-precomposed']"),
            htmlDoc.DocumentNode.SelectNodes("//link[@rel='icon' or @rel='shortcut icon']"),
            new HtmlNodeCollection(htmlDoc.DocumentNode) { defaultFavicon },
        ];

        // Filter node array to only return non-null values and cast to non-nullable array
        return nodeArray.Where(x => x != null).Cast<HtmlNodeCollection>().ToArray();
    }

    private static async Task<byte[]?> TryGetFaviconAsync(HttpClient client, Uri uri)
    {
        HttpResponseMessage response = await client.GetAsync(uri);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var faviconNodes = await GetFaviconNodesFromHtml(response, uri);
        return await TryExtractFaviconFromNodes(faviconNodes, client, uri);
    }

    private static async Task<byte[]?> TryExtractFaviconFromNodes(HtmlNodeCollection[] faviconNodes, HttpClient client, Uri baseUri)
    {
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

                if (!Uri.IsWellFormedUriString(faviconUrl, UriKind.Absolute))
                {
                    faviconUrl = new Uri(baseUri, faviconUrl).ToString();
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

    /// <summary>
    /// Fetches and processes the favicon.
    /// </summary>
    /// <param name="client">The HTTP client.</param>
    /// <param name="url">The URL to fetch the favicon from.</param>
    /// <returns>The favicon bytes.</returns>
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

    /// <summary>
    /// Resizes the image to the target width.
    /// </summary>
    /// <param name="imageBytes">The image bytes to resize.</param>
    /// <param name="contentType">The content type of the image.</param>
    /// <returns>The resized image bytes.</returns>
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
