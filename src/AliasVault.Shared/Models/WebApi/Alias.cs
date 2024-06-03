namespace AliasVault.Shared.Models.WebApi;

public class Alias
{
    public Service Service { get; set; }
    public Identity Identity { get; set; }
    public Password Password { get; set; }
    public DateTime CreateDate { get; set; }
    public DateTime LastUpdate { get; set; }
}
