//-----------------------------------------------------------------------
// <copyright file="SpamOkPasswordGenerator.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Generators.Password.Implementations;

/// <summary>
/// Implementation of IPasswordGenerator which generates passwords using the SpamOK library.
/// </summary>
public class SpamOkPasswordGenerator : IPasswordGenerator
{
    /// <inheritdoc/>
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
