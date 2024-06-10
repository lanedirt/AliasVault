namespace BlazorServer.Models.Spamok;

public class MailboxApiModel
{
    public string Address { get; set; }
    public bool Subscribed { get; set; }
    public List<MailboxEmailApiModel> Mails { get; set; }
}