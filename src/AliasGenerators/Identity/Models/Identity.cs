namespace AliasGenerators.Identity.Models;

public class Identity
{
    public string Id { get; set; }
    public int Gender { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NickName { get; set; }
    public DateTime BirthDate { get; set; }
    public Address Address { get; set; }
    public Job Job { get; set; }
    public List<string> Hobbies { get; set; }
    public string EmailPrefix { get; set; }
    public string Password { get; set; }
    public string PhoneMobile { get; set; }
    public string BankAccountIBAN { get; set; }
    public string ProfilePhotoBase64 { get; set; }
    public string ProfilePhotoPrompt { get; set; }
}

public class Address
{
    public string Street { get; set; }
    public string City { get; set; }
    public string State { get; set; }
    public string ZipCode { get; set; }
    public string Country { get; set; }
}

public class Job
{
    public string Title { get; set; }
    public string Company { get; set; }
    public string Salary { get; set; }
    public decimal SalaryCalculated { get; set; }
    public string Description { get; set; }
}
