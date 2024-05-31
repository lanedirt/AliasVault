namespace AliasGenerators.Password.Implementations;

using AliasGenerators.Implementations;

/// <summary>
/// Implementation of IPasswordGenerator which generates passwords using the SpamOK library.
/// </summary>
public class SpamOkPasswordGenerator : IPasswordGenerator
{
    /// <summary>
    /// Generates a random password using the SpamOK library with diceware (dictionary) method.
    /// </summary>
    /// <returns></returns>
    public string GenerateRandomPassword()
    {
        var passwordBuilder = new SpamOK.PasswordGenerator.BasicPasswordBuilder();
        string password = passwordBuilder
            .SetLength(18)
            .UseLowercaseLetters(true)
            .UseUppercaseLetters(true)
            .UseNumbers(true)
            .UseSpecialChars(true)
            .UseNonAmbiguousChars(false)
            .GeneratePassword()
            .ToString();


        return password;
    }
}
