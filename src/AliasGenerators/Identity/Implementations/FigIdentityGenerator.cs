using System.Text.Json;

namespace AliasGenerators.Identity.Implementations;

/// <summary>
/// Identity generator which generates random identities using the identiteitgenerator.nl semi-public API.
/// </summary>
public class FigIdentityGenerator : IIdentityGenerator
{
    private static readonly HttpClient httpClient = new HttpClient();

    public async Task<Identity.Models.Identity> GenerateRandomIdentityAsync()
    {
        var response = await httpClient.GetAsync("https://api.identiteitgenerator.nl/generate/identity");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var identity = JsonSerializer.Deserialize<Identity.Models.Identity>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return identity;
    }
}
