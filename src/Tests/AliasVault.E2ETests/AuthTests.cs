using Microsoft.Playwright;

namespace AliasVault.E2ETests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class Tests : PlaywrightTest
{
    /// <summary>
    /// Test if the login screen is shown when the app is first started.
    /// </summary>
    [Test]
    public async Task Login()
    {
        // Replace with the URL where your Blazor app is running
        await Page.GotoAsync("http://localhost:5000");
        var navigationTask = Page.WaitForNavigationAsync();
        await navigationTask;

        // Check that we got redirected to /user/login
        var currentUrl = Page.Url;
        Assert.That(currentUrl, Is.EqualTo("http://localhost:5000/user/login"));

        // Try to login with test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        await emailField.FillAsync("test@test.com");
        await passwordField.FillAsync("password");

        // Check if we get redirected when clicking on the login button.
        var loginButton = Page.Locator("button[type='submit']");
        navigationTask = Page.WaitForNavigationAsync(new PageWaitForNavigationOptions() { Timeout = 200000});
        await loginButton.ClickAsync();
        await navigationTask;

        // Check if the redirection occurred
        currentUrl = Page.Url;
        Assert.That(currentUrl, Is.EqualTo("http://localhost:5000/"));

        // Check if the login was successful by verifying content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your aliases below"), "No index content after logging in.");
    }
}
