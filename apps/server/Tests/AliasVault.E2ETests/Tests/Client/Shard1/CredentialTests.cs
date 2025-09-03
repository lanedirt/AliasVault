//-----------------------------------------------------------------------
// <copyright file="CredentialTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard1;

/// <summary>
/// End-to-end tests for the credential management.
/// </summary>
[TestFixture]
[Category("ClientTests")]
[Parallelizable(ParallelScope.Self)]
public class CredentialTests : ClientPlaywrightTest
{
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
    /// Test if creating a new credential entry works with quick create widget.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task CreateCredentialWidgetTest()
    {
        // Navigate to homepage
        await NavigateUsingBlazorRouter("credentials");
        await WaitForUrlAsync("credentials", "Credentials");

        // Create a new alias with service name = "Test Service".
        var serviceName = "Test Service Widget";

        var widgetButton = Page.Locator("button[id='quickIdentityButton']");
        Assert.That(widgetButton, Is.Not.Null, "Create new identity widget button not found.");
        await widgetButton.ClickAsync();

        await InputHelper.FillInputFields(new Dictionary<string, string>
        {
            { "serviceName", serviceName },
        });

        var submitButton = Page.Locator("button[id='quickIdentitySubmit']");
        await submitButton.ClickAsync();

        await WaitForUrlAsync("credentials/**", "View credential");

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
        var editButton = Page.Locator("text=Edit").First;
        await editButton.ClickAsync();
        await WaitForUrlAsync("edit", "Save Credential");

        var serviceNameAfter = "Credential service after";
        await InputHelper.FillInputFields(
            fieldValues: new Dictionary<string, string>
            {
                { "service-name", serviceNameAfter },
            });

        var submitButton = Page.Locator("text=Save Credential").First;
        await submitButton.ClickAsync();
        await WaitForUrlAsync("credentials/**", "Delete");

        pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Credential updated"), "Credential update confirmation message not shown.");
        Assert.That(pageContent, Does.Contain(serviceNameAfter), "Credential not updated correctly.");
    }

    /// <summary>
    /// Test if generating a new identity on the create new credential screen works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task GenerateIdentityTest()
    {
        // Create a new alias with service name = "Test Service".
        var serviceName = "Test Service";

        await NavigateUsingBlazorRouter("credentials/create");
        await WaitForUrlAsync("credentials/create", "Add credentials");

        await InputHelper.FillInputFields(
            fieldValues: new Dictionary<string, string>
            {
                { "service-name", serviceName },
            });

        // 1. First try to generate new username with no identity fields set yet.
        var newUsernameButton = Page.Locator("button[id='generate-username-button']");
        Assert.That(newUsernameButton, Is.Not.Null, "Generate button not found.");
        await newUsernameButton.ClickAsync();
        await Task.Delay(100);

        var username = await Page.InputValueAsync("#username");
        Assert.That(username, Is.Not.Null.And.Not.Empty, "Username not generated before alias is generated.");

        // 2. Then generate a new identity.
        var generateButton = Page.Locator("text=Generate Random Alias");
        Assert.That(generateButton, Is.Not.Null, "Generate button not found.");
        await generateButton.First.ClickAsync();

        // Wait for the identity fields to be filled.
        await Task.Delay(100);

        // Verify that the identity fields are filled.
        username = await Page.InputValueAsync("#username");
        var firstName = await Page.InputValueAsync("#first-name");
        var lastName = await Page.InputValueAsync("#last-name");

        Assert.Multiple(
            () =>
        {
            Assert.That(username, Is.Not.Null.And.Not.Empty, "Username not generated.");
            Assert.That(firstName, Is.Not.Null.And.Not.Empty, "First name not generated.");
            Assert.That(lastName, Is.Not.Null.And.Not.Empty, "Last name not generated.");
        });

        // 3. Regenerate the username field again.
        newUsernameButton = Page.Locator("button[id='generate-username-button']");
        await newUsernameButton.ClickAsync();

        await Task.Delay(100);
        username = await Page.InputValueAsync("#username");
        Assert.That(username, Is.Not.Null.And.Not.Empty, "Username not generated after alias is generated.");
    }
}
