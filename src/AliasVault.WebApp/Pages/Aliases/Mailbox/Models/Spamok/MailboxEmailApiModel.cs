namespace BlazorServer.Models.Spamok;

public class MailboxEmailApiModel
{
    public int Id { get; set; }
    public string Subject { get; set; }
    public string FromDisplay { get; set; }
    public string FromDomain { get; set; }
    public string FromLocal { get; set; }
    public string ToDomain { get; set; }
    public string ToLocal { get; set; }
    public DateTime Date { get; set; }
    public DateTime DateSystem { get; set; }
    public string MessagePreview { get; set; }
    public double SecondsAgo { get; set; }
}