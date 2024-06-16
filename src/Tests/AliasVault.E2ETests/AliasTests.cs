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
    /// Helper method to fill all input fields on a page with random data.
    /// </summary>
    /// <param name="page">IPage instance where to fill the input fields for.</param>
    /// <returns>Async task.</returns>
    public static async Task FillAllInputFields(IPage page)
    {
        // Locate all input fields
        var inputFields = page.Locator("input");

        // Get the count of input fields
        var count = await inputFields.CountAsync();

        // Iterate through each input field and fill with random data
        for (int i = 0; i < count; i++)
        {
            var input = inputFields.Nth(i);
            var inputType = await input.GetAttributeAsync("type");

            // Generate appropriate random data based on input type
            string randomData = inputType switch
            {
                "email" => GenerateRandomEmail(),
                "number" => GenerateRandomNumber(),
                "password" => GenerateRandomPassword(),
                _ => GenerateRandomString(), // Default for all other types
            };

            await input.FillAsync(randomData);
        }
    }

    /// <summary>
    /// Test if the alias listing index page works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task AliasListingCorrect()
    {
        await Page.GotoAsync(AppBaseUrl + "aliases");
        await Page.WaitForURLAsync("**/aliases", new PageWaitForURLOptions() { Timeout = 2000 });

        // Wait for the content to load.
        await Page.WaitForSelectorAsync("text=AliasVault");

        // Check if the expected content is present.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your aliases below"), "No index content after logging in.");
    }

    /// <summary>
    /// Test if creating a new alias works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task CreateAlias()
    {
        await Page.GotoAsync(AppBaseUrl + "add-alias");
        await Page.WaitForURLAsync("**/add-alias", new PageWaitForURLOptions() { Timeout = 2000 });

        // Wait for the content to load.
        await Page.WaitForSelectorAsync("text=AliasVault");

        // Check if a button with text "Generate Random Identity" appears
        var generateButton = Page.Locator("text=Generate Random Identity");
        Assert.That(generateButton, Is.Not.Null, "Generate button not found.");

        // Fill all input fields with random data
        await FillAllInputFields(Page);

        // Press submit button with text "Create Alias"
        var submitButton = Page.Locator("text=Save Alias").First;
        await submitButton.ClickAsync();
        await Page.WaitForURLAsync("**/alias/**", new PageWaitForURLOptions() { Timeout = 2000 });

        // Check if the redirection occurred
        var currentUrl = Page.Url;
        Assert.That(currentUrl, Does.Contain(AppBaseUrl + "alias/"));

        // Wait for the content to load.
        await Page.WaitForSelectorAsync("text=Login credentials");

        // Check if the alias was created
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Login credentials"), "Alias not created.");

        // TODO: Implement proper data input and verification if what was created is correct.
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
}
