namespace GenericHelpers;

using System;
using System.Net.Http;
using System.Threading.Tasks;
using HtmlAgilityPack;

public class FaviconService
{
    public static async Task<byte[]?> GetFaviconAsync(string url)
    {
        try
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

                // Try to find the favicon link in the HTML
                var faviconNode = htmlDoc.DocumentNode.SelectSingleNode("//link[@rel='icon' or @rel='shortcut icon']");
                if (faviconNode == null)
                {
                    return null;
                }

                var faviconUrl = faviconNode.GetAttributeValue("href", null);
                if (string.IsNullOrEmpty(faviconUrl))
                {
                    return null;
                }

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
        catch
        {
            return null;
        }
    }
}
