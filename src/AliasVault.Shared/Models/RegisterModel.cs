namespace AliasVault.Shared.Models;

public class RegisterModel
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string PasswordConfirm { get; set; }
    public bool AcceptTerms { get; set; }
}
