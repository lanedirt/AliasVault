namespace FaviconExtractor;

using System;
using System.Net.Http;
using System.Threading.Tasks;
using HtmlAgilityPack;

public class FaviconService
{
    public static async Task<byte[]> GetFaviconAsync(string url)
    {
        using (HttpClient client = new HttpClient())
        {
            HttpResponseMessage response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            string htmlContent = await response.Content.ReadAsStringAsync();
            HtmlDocument htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(htmlContent);

            // Find all favicon links in the HTML
            var faviconNodes = htmlDoc.DocumentNode.SelectNodes("//link[contains(@rel, 'icon')]");
            if (faviconNodes == null || !faviconNodes.Any())
            {
                return null;
            }

            // Extract favicon URLs and their sizes
            var favicons = faviconNodes
                .Select(node => new
                {
                    Url = node.GetAttributeValue("href", null),
                    Size = GetFaviconSize(node.GetAttributeValue("sizes", "0x0"))
                })
                .Where(favicon => !string.IsNullOrEmpty(favicon.Url))
                .OrderByDescending(favicon => favicon.Size)
                .ToList();

            if (!favicons.Any())
            {
                return null;
            }

            var bestFavicon = favicons.First();
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
    }

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
