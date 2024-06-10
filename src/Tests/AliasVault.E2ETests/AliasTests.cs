using Microsoft.Playwright;

namespace AliasVault.E2ETests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class AliasTests : PlaywrightTest
{
    /// <summary>
    /// Test if registering a new account works.
    /// </summary>
    [Test]
    public async Task AliasListingCorrect()
    {
        var navigationTask = Page.WaitForNavigationAsync();
        await Page.GotoAsync(_appBaseUrl + "aliases");
        await navigationTask;

        // Wait for the content to load.
        await Page.WaitForSelectorAsync("text=AliasVault");

        // Check if the expected content is present.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your aliases below"), "No index content after logging in.");
    }

    /// <summary>
    /// Test if registering a new account works.
    /// </summary>
    [Test]
    public async Task CreateAlias()
    {
        var navigationTask = Page.WaitForNavigationAsync();
        await Page.GotoAsync(_appBaseUrl + "add-alias");
        await navigationTask;

        // Wait for the content to load.
        await Page.WaitForSelectorAsync("text=AliasVault");

        // Check if a button with text "Generate Random Identity" appears
        var generateButton = Page.Locator("text=Generate Random Identity");
        Assert.That(generateButton, Is.Not.Null, "Generate button not found.");

        // Fill all input fields with random data
        await FillAllInputFields(Page);

        // Press submit button with text "Create Alias"
        var submitButton = Page.Locator("text=Save Alias").First;
        navigationTask = Page.WaitForNavigationAsync(new PageWaitForNavigationOptions() { Timeout = 200000 });
        await submitButton.ClickAsync();
        await navigationTask;

        // Check if the redirection occurred
        var currentUrl = Page.Url;
        Assert.That(currentUrl, Does.Contain(_appBaseUrl + "alias/"));

        // Wait for the content to load.
        await Page.WaitForSelectorAsync("text=Login credentials");

        // Check if the alias was created
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Login credentials"), "Alias not created.");

        // TODO: Implement proper data input and verification if what was created is correct.
    }

    private static readonly Random Random = new Random();

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
                _ => GenerateRandomString() // Default for text, search, etc.
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
}
