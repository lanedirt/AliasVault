//-----------------------------------------------------------------------
// <copyright file="IdentityGeneratorFactory.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Generators.Identity.Implementations.Factories;

using AliasVault.Generators.Identity.Implementations.Base;

/// <summary>
/// Identity generator factory which creates an identity generator based on the language code.
/// </summary>
public static class IdentityGeneratorFactory
{
    /// <summary>
    /// Creates an identity generator based on the language code.
    /// </summary>
    /// <param name="languageCode">Two letter language code.</param>
    /// <returns>The IdentityGenerator for the requested language.</returns>
    /// <exception cref="ArgumentException">Thrown if no identity generator is found for the requested language.</exception>
    public static IdentityGenerator CreateIdentityGenerator(string languageCode)
    {
        return languageCode.ToLower() switch
        {
            "nl" => new IdentityGeneratorNl(),
            "en" => new IdentityGeneratorEn(),
            _ => throw new ArgumentException($"Unsupported language code: {languageCode}", nameof(languageCode)),
        };
    }
}
