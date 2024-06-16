//-----------------------------------------------------------------------
// <copyright file="FaviconExtractorTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Tests;

/// <summary>
/// Tests for the FaviconExtractor class.
/// </summary>
public class FaviconExtractorTests
{
    /// <summary>
    /// Common setup for all tests.
    /// </summary>
    [SetUp]
    public void Setup()
    {
    }

    /// <summary>
    /// Test extracting a favicon from a known website.
    /// </summary>
    [Test]
    public void ExtractFaviconSpamOK()
    {
        var faviconBytes = FaviconExtractor.FaviconExtractor.GetFaviconAsync("https://spamok.com");
        Assert.That(faviconBytes, Is.Not.Null);
    }
}
