//-----------------------------------------------------------------------
// <copyright file="AliasTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests;

/// <summary>
/// End-to-end tests for the alias management.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class AliasTests : PlaywrightTest
{
    private static readonly Random Random = new();

    /// <summary>
    /// Test if the alias listing index page works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task AliasListingTest()
    {
        await NavigateUsingBlazorRouter("aliases");
        await WaitForURLAsync("**/aliases", "AliasVault");

        // Check if the expected content is present.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your logins below"), "No index content after logging in.");
    }

    /// <summary>
    /// Test if creating a new alias works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task CreateAliasTest()
    {
        // Create a new alias with service name = "Test Service".
        var serviceName = "Test Service";
        await CreateAlias(new Dictionary<string, string>
        {
            { "service-name", serviceName },
        });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceName), "Created alias service name does not appear on alias page.");
    }

    /// <summary>
    /// Test if editing a created alias works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task EditAliasTest()
    {
        // Create a new alias with service name = "Alias service before".
        var serviceNameBefore = "Login service before";
        await CreateAlias(new Dictionary<string, string>
        {
            { "service-name", serviceNameBefore },
        });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceNameBefore), "Created login service name does not appear on login page.");

        // Click the edit button.
        var editButton = Page.Locator("text=Edit login").First;
        await editButton.ClickAsync();
        await WaitForURLAsync("**/edit", "Save Login");

        // Replace the service name with "Alias service after".
        var serviceNameAfter = "Login service after";
        await InputHelper.FillInputFields(
            fieldValues: new Dictionary<string, string>
            {
                { "service-name", serviceNameAfter },
            });

        var submitButton = Page.Locator("text=Save Login").First;
        await submitButton.ClickAsync();
        await WaitForURLAsync("**/login/**", "View Login");

        pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Login updated"), "Login update confirmation message not shown.");
        Assert.That(pageContent, Does.Contain(serviceNameAfter), "Login not updated correctly.");
    }

    /// <summary>
    /// Create new alias.
    /// </summary>
    /// <param name="formValues">Dictionary with html element ids and values to input as field value.</param>
    /// <returns>Async task.</returns>
    private async Task CreateAlias(Dictionary<string, string>? formValues = null)
    {
        await NavigateUsingBlazorRouter("add-login");
        await WaitForURLAsync("**/add-login", "Add login");

        // Check if a button with text "Generate Random Identity" appears
        var generateButton = Page.Locator("text=Generate Random Identity");
        Assert.That(generateButton, Is.Not.Null, "Generate button not found.");

        // Fill all input fields with specified values and remaining empty fields with random data.
        await InputHelper.FillInputFields(formValues);
        await InputHelper.FillEmptyInputFieldsWithRandom();

        var submitButton = Page.Locator("text=Save Login").First;
        await submitButton.ClickAsync();
        await WaitForURLAsync("**/login/**", "Login credentials");

        // Check if the alias was created
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Login credentials"), "Alias not created.");
    }
}
