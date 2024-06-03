using System.Text.Json.Serialization;

namespace AliasVault.Shared.Models;

public class TokenModel
{
    [JsonPropertyName("token")]
    public string Token { get; set; }

    [JsonPropertyName("refreshToken")]
    public string RefreshToken { get; set; }
}
