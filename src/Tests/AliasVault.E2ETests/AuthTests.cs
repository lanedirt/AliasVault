using Microsoft.Playwright;

namespace AliasVault.E2ETests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class AuthTests : PlaywrightTest
{
    /// <summary>
    /// Test if registering a new account works.
    /// </summary>
    [Test]
    public async Task LogoutAndLogin()
    {
        // Logout
        var navigationTask = Page.WaitForNavigationAsync();
        await Page.GotoAsync(_appBaseUrl + "user/logout");
        await navigationTask;

        // Wait for the content to load.
        await Page.WaitForSelectorAsync("text=AliasVault");

        // Check that we got redirected to /user/login
        var currentUrl = Page.Url;
        Assert.That(currentUrl, Is.EqualTo(_appBaseUrl + "user/login"));

        await Login();
    }

    /// <summary>
    /// Test if logging in works.
    /// </summary>
    public async Task Login()
    {
        await Page.GotoAsync(_appBaseUrl);
        var navigationTask = Page.WaitForNavigationAsync();
        await navigationTask;

        // Check that we got redirected to /user/login
        var currentUrl = Page.Url;
        Assert.That(currentUrl, Is.EqualTo(_appBaseUrl + "user/login"));

        // Try to login with test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        await emailField.FillAsync(_randomEmail);
        await passwordField.FillAsync(_randomPassword);

        // Check if we get redirected when clicking on the login button.
        var loginButton = Page.Locator("button[type='submit']");
        navigationTask = Page.WaitForNavigationAsync(new PageWaitForNavigationOptions() { Timeout = 200000});
        await loginButton.ClickAsync();
        await navigationTask;

        // Check if the redirection occurred
        currentUrl = Page.Url;
        Assert.That(currentUrl, Is.EqualTo(_appBaseUrl));

        // Check if the login was successful by verifying content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your aliases below"), "No index content after logging in.");
    }
}
