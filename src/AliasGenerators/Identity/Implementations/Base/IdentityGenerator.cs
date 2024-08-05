//-----------------------------------------------------------------------
// <copyright file="IdentityGenerator.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasGenerators.Identity.Implementations.Base;

using System.Reflection;
using AliasGenerators.Identity;
using AliasGenerators.Identity.Models;

/// <summary>
/// Dutch identity generator which implements IIdentityGenerator and generates
/// random dutch identities.
/// </summary>
public abstract class IdentityGenerator : IIdentityGenerator
{
    /// <summary>
    /// List of male first names in memory.
    /// </summary>
    private readonly List<string> _firstNamesMale;

    /// <summary>
    /// List of female first names in memory.
    /// </summary>
    private readonly List<string> _firstNamesFemale;

    /// <summary>
    /// List of last names in memory.
    /// </summary>
    private readonly List<string> _lastNames;

    /// <summary>
    /// Random instance.
    /// </summary>
    private readonly Random _random = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="IdentityGenerator"/> class.
    /// </summary>
    public IdentityGenerator()
    {
        _firstNamesMale = LoadList(FirstNamesListMale);
        _firstNamesFemale = LoadList(FirstNamesListFemale);
        _lastNames = LoadList(LastNamesList);
    }

    /// <summary>
    /// Gets namespace path to the male first names list for the correct language.
    /// </summary>
    protected virtual string FirstNamesListMale => "AliasGenerators.Identity.Implementations.Dictionaries.nl.firstnames_male";

    /// <summary>
    /// Gets namespace path to the female first names list for the correct language.
    /// </summary>
    protected virtual string FirstNamesListFemale => "AliasGenerators.Identity.Implementations.Dictionaries.nl.firstnames_female";

    /// <summary>
    /// Gets namespace path to the last names list for the correct language.
    /// </summary>
    protected virtual string LastNamesList => "AliasGenerators.Identity.Implementations.Dictionaries.nl.lastnames";

    /// <inheritdoc/>
    public async Task<Identity> GenerateRandomIdentityAsync()
    {
        await Task.Yield(); // Add an await statement to make the method truly asynchronous.

        // Generate identity.
        var identity = new Identity();

        // Determine gender.
        if (_random.Next(2) == 0)
        {
            identity.FirstName = _firstNamesMale[_random.Next(_firstNamesMale.Count)];
            identity.Gender = Gender.Male;
        }
        else
        {
            identity.FirstName = _firstNamesFemale[_random.Next(_firstNamesFemale.Count)];
            identity.Gender = Gender.Female;
        }

        identity.LastName = _lastNames[_random.Next(_lastNames.Count)];

        // Generate random date of birth between 21 and 65 years of age.
        identity.BirthDate = GenerateRandomDateOfBirth();
        identity.EmailPrefix = new UsernameEmailGenerator().GenerateEmailPrefix(identity);
        identity.NickName = new UsernameEmailGenerator().GenerateUsername(identity);

        return identity;
    }

    /// <summary>
    /// Load a list of words from a resource file.
    /// </summary>
    /// <param name="resourceName">Name of the resource file to load.</param>
    /// <returns>List of words from the resource file.</returns>
    /// <exception cref="FileNotFoundException">Thrown if resource file cannot be found.</exception>
    private static List<string> LoadList(string resourceName)
    {
        var assembly = Assembly.GetExecutingAssembly();

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new FileNotFoundException("Resource '" + resourceName + "' not found.", resourceName);
        }

        using var reader = new StreamReader(stream);
        var words = new List<string>();
        while (!reader.EndOfStream)
        {
            var line = reader.ReadLine();
            if (line != null)
            {
                words.Add(line);
            }
        }

        return words;
    }

    /// <summary>
    /// Generate a random date of birth.
    /// </summary>
    /// <returns>DateTime representing date of birth.</returns>
    private DateTime GenerateRandomDateOfBirth()
    {
        // Generate random date of birth between 21 and 65 years of age.
        var now = DateTime.Now;
        var minDob = now.AddYears(-65);
        var maxDob = now.AddYears(-21);
        return minDob.AddDays(_random.Next((int)(maxDob - minDob).TotalDays));
    }
}
