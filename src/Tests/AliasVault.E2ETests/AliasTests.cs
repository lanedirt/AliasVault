//-----------------------------------------------------------------------
// <copyright file="AliasTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests;

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
        Assert.That(pageContent, Does.Contain("Find all of your aliases below"), "No index content after logging in.");
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
        var serviceNameBefore = "Alias service before";
        await CreateAlias(new Dictionary<string, string>
        {
            { "service-name", serviceNameBefore },
        });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceNameBefore), "Created alias service name does not appear on alias page.");

        // Click the edit button.
        var editButton = Page.Locator("text=Edit alias").First;
        await editButton.ClickAsync();
        await WaitForURLAsync("**/edit", "Save Alias");

        // Replace the service name with "Alias service after".
        var serviceNameAfter = "Alias service after";
        await FillInputFields(
            page: Page,
            fieldValues: new Dictionary<string, string>
            {
                { "service-name", serviceNameAfter },
            });

        var submitButton = Page.Locator("text=Save Alias").First;
        await submitButton.ClickAsync();
        await WaitForURLAsync("**/alias/**", "View alias");

        pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Alias updated"), "Alias update confirmation message not shown.");
        Assert.That(pageContent, Does.Contain(serviceNameAfter), "Alias not updated correctly.");
    }

    /// <summary>
    /// Helper method to fill specified input fields on a page with given values.
    /// </summary>
    /// <param name="page">IPage instance where to fill the input fields for.</param>
    /// <param name="fieldValues">Dictionary with html element ids and values to input as field value.</param>
    /// <returns>Async task.</returns>
    private static async Task FillInputFields(IPage page, Dictionary<string, string>? fieldValues = null)
    {
        var inputFields = page.Locator("input");
        var count = await inputFields.CountAsync();
        for (int i = 0; i < count; i++)
        {
            var input = inputFields.Nth(i);
            var inputId = await input.GetAttributeAsync("id");

            // If fieldValues dictionary is provided and the inputId is found in it, fill the input with the value.
            if (inputId is not null && fieldValues is not null && fieldValues.TryGetValue(inputId, out var fieldValue))
            {
                await input.FillAsync(fieldValue);
            }
        }
    }

    /// <summary>
    /// Helper method to fill all empty input fields on a page with random data if not provided.
    /// </summary>
    /// <param name="page">IPage instance where to fill the input fields for.</param>
    /// <returns>Async task.</returns>
    private static async Task FillEmptyInputFieldsWithRandom(IPage page)
    {
        var inputFields = page.Locator("input");
        var count = await inputFields.CountAsync();
        for (int i = 0; i < count; i++)
        {
            var input = inputFields.Nth(i);
            var inputType = await input.GetAttributeAsync("type");

            // If is not empty, skip.
            if (!string.IsNullOrEmpty(await input.InputValueAsync()))
            {
                continue;
            }

            // Generate appropriate random data based on input type.
            string randomData = inputType switch
            {
                "email" => GenerateRandomEmail(),
                "number" => GenerateRandomNumber(),
                "password" => GenerateRandomPassword(),
                _ => GenerateRandomString(), // Default for all other types.
            };

            await input.FillAsync(randomData);
        }
    }

    private static string GenerateRandomString(int length = 10)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[Random.Next(s.Length)]).ToArray());
    }

    private static string GenerateRandomEmail()
    {
        return $"{GenerateRandomString(5)}@example.com";
    }

    private static string GenerateRandomNumber()
    {
        return Random.Next(0, 10000).ToString();
    }

    private static string GenerateRandomPassword(int length = 12)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[Random.Next(s.Length)]).ToArray());
    }

    /// <summary>
    /// Create new alias.
    /// </summary>
    /// <param name="formValues">Dictionary with html element ids and values to input as field value.</param>
    /// <returns>Async task.</returns>
    private async Task CreateAlias(Dictionary<string, string>? formValues = null)
    {
        await NavigateUsingBlazorRouter("add-alias");
        await WaitForURLAsync("**/add-alias", "Add alias");

        // Check if a button with text "Generate Random Identity" appears
        var generateButton = Page.Locator("text=Generate Random Identity");
        Assert.That(generateButton, Is.Not.Null, "Generate button not found.");

        // Fill all input fields with specified values and remaining empty fields with random data.
        await FillInputFields(Page, formValues);
        await FillEmptyInputFieldsWithRandom(Page);

        var submitButton = Page.Locator("text=Save Alias").First;
        await submitButton.ClickAsync();
        await WaitForURLAsync("**/alias/**", "Login credentials");

        // Check if the alias was created
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Login credentials"), "Alias not created.");
    }
}
