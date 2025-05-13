//-----------------------------------------------------------------------
// <copyright file="IdentityGeneratorTest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.UnitTests.Generators;

using System.Net.Mail;
using AliasVault.Generators.Identity.Implementations.Factories;
using AliasVault.Generators.Identity.Models;

/// <summary>
/// Tests for the IdentityGenerator.
/// </summary>
public class IdentityGeneratorTest
{
    /// <summary>
    /// Tests the generation of random dutch identities.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task TestNlGenerator()
    {
        // Generate random NL identity.
        var generator = IdentityGeneratorFactory.CreateIdentityGenerator("nl");

        // Generate 10 identities, check if they are all unique.
        var identities = new List<Identity>();
        for (var i = 0; i < 10; i++)
        {
            var identity = await generator.GenerateRandomIdentityAsync();
            Console.WriteLine($"Generated identity: {identity.FirstName} {identity.LastName} ({identity.Gender}) - {identity.BirthDate.ToShortDateString()} - {identity.NickName} - {identity.EmailPrefix}@domain.tld");

            identities.Add(identity);
        }

        Assert.That(identities, Has.Count.EqualTo(10), "Should generate 10 identities");
        Assert.That(
            identities,
            Is.All.Matches<Identity>(
                    i =>
                    !string.IsNullOrWhiteSpace(i.FirstName) && !string.IsNullOrWhiteSpace(i.LastName)),
            "All identities should have non-empty first and last names");
        Assert.That(identities, Is.Unique, "All identities should be unique");

        foreach (var identity in identities)
        {
            var email = identity.EmailPrefix + "@domain.tld";
            Assert.DoesNotThrow(
                () =>
                new MailAddress(email),
                $"Email address '{email}' is not a valid email. Check email prefix generation logic.");
        }
    }

    /// <summary>
    /// Tests the generation of random english identities.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task TestEnGenerator()
    {
        // Generate random EN identity.
        var generator = IdentityGeneratorFactory.CreateIdentityGenerator("en");

        // Generate 10 identities, check if they are all unique.
        var identities = new List<Identity>();
        for (var i = 0; i < 10; i++)
        {
            var identity = await generator.GenerateRandomIdentityAsync();
            Console.WriteLine($"Generated identity: {identity.FirstName} {identity.LastName} ({identity.Gender}) - {identity.BirthDate.ToShortDateString()} - {identity.NickName} - {identity.EmailPrefix}@domain.tld");

            identities.Add(identity);
        }

        Assert.That(identities, Has.Count.EqualTo(10), "Should generate 10 identities");
        Assert.That(
            identities,
            Is.All.Matches<Identity>(
                i =>
                    !string.IsNullOrWhiteSpace(i.FirstName) && !string.IsNullOrWhiteSpace(i.LastName)),
            "All identities should have non-empty first and last names");
        Assert.That(identities, Is.Unique, "All identities should be unique");

        foreach (var identity in identities)
        {
            var email = identity.EmailPrefix + "@domain.tld";
            Assert.DoesNotThrow(
                () =>
                    new MailAddress(email),
                $"Email address '{email}' is not a valid email. Check email prefix generation logic.");
        }
    }
}
