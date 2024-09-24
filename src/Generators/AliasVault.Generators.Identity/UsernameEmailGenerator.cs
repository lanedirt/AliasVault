//-----------------------------------------------------------------------
// <copyright file="UsernameEmailGenerator.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Generators.Identity;

using System.Text.RegularExpressions;

/// <summary>
/// Generates usernames and email prefixes based on an identity.
/// </summary>
public class UsernameEmailGenerator
{
    /// <summary>
    /// Minimum length of the generated username.
    /// </summary>
    private const int MinLength = 6;

    /// <summary>
    /// Maximum length of the generated username.
    /// </summary>
    private const int MaxLength = 20;

    /// <summary>
    /// Create a new random instance for generating random values.
    /// </summary>
    private readonly Random _random = new();

    /// <summary>
    /// List of allowed symbols to use in usernames.
    /// </summary>
    private readonly List<string> _symbols = [".", "-"];

    /// <summary>
    /// Generates a username based on a identity.
    /// </summary>
    /// <param name="identity">Identity to generate username for.</param>
    /// <returns>Username as string.</returns>
    public string GenerateUsername(Models.Identity identity)
    {
        // Generate username based on email prefix but strip all non-alphanumeric characters
        string username = GenerateEmailPrefix(identity);
        username = Regex.Replace(username, @"[^a-zA-Z0-9]", string.Empty, RegexOptions.NonBacktracking);

        // Adjust length
        if (username.Length < MinLength)
        {
            username += GenerateRandomString(MinLength - username.Length);
        }
        else if (username.Length > MaxLength)
        {
            username = username.Substring(0, MaxLength);
        }

        return username;
    }

    /// <summary>
    /// Generates a valid email prefix based on an identity.
    /// </summary>
    /// <param name="identity">Identity to generate email prefix for.</param>
    /// <returns>Valid email prefix as string.</returns>
    public string GenerateEmailPrefix(Models.Identity identity)
    {
        var parts = new List<string>();

        // Use first initial + last name
        if (_random.Next(2) == 0)
        {
            parts.Add(identity.FirstName.Substring(0, 1).ToLower() + identity.LastName.ToLower());
        }
        else
        {
            // Use full name
            parts.Add((identity.FirstName + identity.LastName).ToLower());
        }

        // Add birth year
        if (_random.Next(2) == 0)
        {
            parts.Add(identity.BirthDate.Year.ToString().Substring(2));
        }

        // Join parts and sanitize
        var emailPrefix = string.Join(GetRandomSymbol(), parts);
        emailPrefix = SanitizeEmailPrefix(emailPrefix);

        // Adjust length
        if (emailPrefix.Length < MinLength)
        {
            emailPrefix += GenerateRandomString(MinLength - emailPrefix.Length);
        }
        else if (emailPrefix.Length > MaxLength)
        {
            emailPrefix = emailPrefix.Substring(0, MaxLength);
        }

        return emailPrefix;
    }

    /// <summary>
    /// Sanitize the email prefix by removing invalid characters and ensuring it's a valid email prefix.
    /// </summary>
    /// <param name="input">The input string to sanitize.</param>
    /// <returns>The sanitized string.</returns>
    private static string SanitizeEmailPrefix(string input)
    {
        // Remove any character that's not a letter, number, dot, underscore, or hyphen including special characters
        string sanitized = Regex.Replace(input, @"[^a-zA-Z0-9._-]", string.Empty, RegexOptions.NonBacktracking);

        // Remove consecutive dots, underscores, or hyphens
        sanitized = Regex.Replace(sanitized, @"[-_.]{2,}", m => m.Value[0].ToString(), RegexOptions.NonBacktracking);

        // Ensure it doesn't start or end with a dot, underscore, or hyphen
        sanitized = sanitized.Trim('.', '_', '-');

        return sanitized;
    }

    /// <summary>
    /// Get a random symbol from the list of symbols.
    /// </summary>
    /// <returns>Random symbol.</returns>
    private string GetRandomSymbol()
    {
        return _random.Next(3) == 0 ? _symbols[_random.Next(_symbols.Count)] : string.Empty;
    }

    /// <summary>
    /// Generate a random string of a given length.
    /// </summary>
    /// <param name="length">Length of string to generate.</param>
    /// <returns>String with random characters.</returns>
    private string GenerateRandomString(int length)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[_random.Next(s.Length)]).ToArray());
    }
}
