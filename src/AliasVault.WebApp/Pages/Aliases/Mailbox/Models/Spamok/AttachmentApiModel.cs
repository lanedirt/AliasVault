namespace BlazorServer.Models.Spamok;

public class AttachmentApiModel
{
    public int Id { get; set; }
    public int Email_Id { get; set; }
    public string Filename { get; set; }
    public string MimeType { get; set; }
    public int Filesize { get; set; }
}