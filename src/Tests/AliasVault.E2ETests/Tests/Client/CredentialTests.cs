//-----------------------------------------------------------------------
// <copyright file="CredentialTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client;

/// <summary>
/// End-to-end tests for the credential management.
/// </summary>
[TestFixture]
[Category("ClientTests")]
[Parallelizable(ParallelScope.Self)]
public class CredentialTests : ClientPlaywrightTest
{
    private static readonly Random Random = new();

    /// <summary>
    /// Test if the credential listing index page works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task CredentialListingTest()
    {
        await NavigateUsingBlazorRouter("credentials");
        await WaitForUrlAsync("credentials", "AliasVault");

        // Check if the expected content is present.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your credentials below"), "No index content after logging in.");
    }

    /// <summary>
    /// Test if creating a new credential entry works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task CreateCredentialTest()
    {
        // Create a new alias with service name = "Test Service".
        var serviceName = "Test Service";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceName },
        });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceName), "Created credential service name does not appear on alias page.");
    }

    /// <summary>
    /// Test if editing a created credential entry works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task EditCredentialTest()
    {
        var serviceNameBefore = "Credential service before";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceNameBefore },
        });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceNameBefore), "Created credential service name does not appear on login page.");

        // Click the edit button.
        var editButton = Page.Locator("text=Edit credentials entry").First;
        await editButton.ClickAsync();
        await WaitForUrlAsync("edit", "Save Credentials");

        var serviceNameAfter = "Credential service after";
        await InputHelper.FillInputFields(
            fieldValues: new Dictionary<string, string>
            {
                { "service-name", serviceNameAfter },
            });

        var submitButton = Page.Locator("text=Save Credentials").First;
        await submitButton.ClickAsync();
        await WaitForUrlAsync("credentials/**", "View credentials entry");

        pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Credentials updated"), "Credential update confirmation message not shown.");
        Assert.That(pageContent, Does.Contain(serviceNameAfter), "Credential not updated correctly.");
    }
}