//-----------------------------------------------------------------------
// <copyright file="FaviconExtractorTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Tests.Utilities;

/// <summary>
/// Tests for the FaviconExtractor class.
/// </summary>
public class FaviconExtractorTests
{
    /// <summary>
    /// Test extracting a favicon from a known website.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task ExtractFaviconSpamOk()
    {
        var faviconBytes = await FaviconExtractor.FaviconExtractor.GetFaviconAsync("https://spamok.com");
        Assert.That(faviconBytes, Is.Not.Null);
    }

    /// <summary>
    /// Test extracting a favicon from a known website.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task ExtractFaviconDumpert()
    {
        var faviconBytes = await FaviconExtractor.FaviconExtractor.GetFaviconAsync("https://www.dumpert.nl");
        Assert.That(faviconBytes, Is.Not.Null);
    }

    /// <summary>
    /// Test extracting a favicon from a known website.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task ExtractFaviconGoogle()
    {
        var faviconBytes = await FaviconExtractor.FaviconExtractor.GetFaviconAsync("https://adsense.google.com/start/");
        Assert.That(faviconBytes, Is.Not.Null);
    }
}
