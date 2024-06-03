namespace AliasVault.Shared.Models.WebApi;

public class Identity
{
    public Guid Id { get; set; }
    public string Gender { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NickName { get; set; }
    public DateTime BirthDate { get; set; }
    public string AddressStreet { get; set; }
    public string AddressCity { get; set; }
    public string AddressState { get; set; }
    public string AddressZipCode { get; set; }
    public string AddressCountry { get; set; }
    public string Hobbies { get; set; }
    public string EmailPrefix { get; set; }
    public string PhoneMobile { get; set; }
    public string BankAccountIBAN { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Password? DefaultPassword { get; set; }
}
