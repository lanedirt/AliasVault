namespace AliasVault.Shared.Models.WebApi;

public class Service
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? LogoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
