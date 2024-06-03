namespace AliasVault.Shared.Models.WebApi;

public class AliasListEntry
{
    public Guid Id { get; set; }
    public byte[] Logo { get; set; }
    public string Service { get; set; }
    public DateTime CreateDate { get; set; }
}
