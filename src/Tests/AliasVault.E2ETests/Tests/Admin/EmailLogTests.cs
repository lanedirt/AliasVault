//-----------------------------------------------------------------------
// <copyright file="EmailLogTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Admin;

/// <summary>
/// End-to-end tests for email log feature.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class EmailLogTests : AdminPlaywrightTest
{
    /// <summary>
    /// Test if accessing the email log index page works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task EmailLogIndexTest()
    {
        // Navigate to emails page.
        await NavigateBrowser("emails");
        await WaitForUrlAsync("emails", "received mails");

        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("received mails"), "No email page content found.");
    }
}
