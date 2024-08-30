//-----------------------------------------------------------------------
// <copyright file="AuthTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client;

/// <summary>
/// End-to-end tests for authentication.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ClientTests")]
[TestFixture]
public class AuthTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if logging out and logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task LogoutAndLoginTest()
    {
        // Logout.
        await NavigateUsingBlazorRouter("user/logout");
        await WaitForUrlAsync("user/logout", "AliasVault");

        // Wait and check if we get redirected to /user/login.
        await WaitForUrlAsync("user/login");

        await Login();
    }

    /// <summary>
    /// Test if registering an account with the same email address as an existing account shows a warning.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(2)]
    public async Task RegisterFormWarningTest()
    {
        // Logout.
        await NavigateUsingBlazorRouter("user/logout");
        await WaitForUrlAsync("user/logout", "AliasVault");

        // Wait and check if we get redirected to /user/login.
        await WaitForUrlAsync("user/login");

        // Try to register a new account.
        var registerButton = Page.Locator("a[href='/user/register']");
        await registerButton.ClickAsync();
        await WaitForUrlAsync("user/register");

        // Register account with same test credentials as used in the initial registration bootstrap method.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        var password2Field = Page.Locator("input[id='password2']");
        await emailField.FillAsync(TestUserUsername);
        await passwordField.FillAsync(TestUserPassword);
        await password2Field.FillAsync(TestUserPassword);

        // Check the terms of service checkbox
        var termsCheckbox = Page.Locator("input[id='terms']");
        await termsCheckbox.CheckAsync();

        // Check if we get a visible warning when trying to register.
        var submitButton = Page.Locator("button[type='submit']");
        await submitButton.ClickAsync();

        var warning = await Page.TextContentAsync("div[role='alert']");
        Assert.That(warning, Does.Contain("is already taken."), "No visible warning when registering with existing email address.");
    }

    /// <summary>
    /// Test if entering a wrong password too many times locks the account.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(3)]
    public async Task PasswordAuthLockoutTest()
    {
        // Logout.
        await NavigateUsingBlazorRouter("user/logout");
        await WaitForUrlAsync("user/login", "AliasVault");

        // Fill in wrong password 11 times. After 11 times, the account should be locked.
        // Note: the actual lockout happens on the 10th wrong attempt, but the lockout message is only displayed
        // on the next attempt, so we need to try 11 times to see the lockout message.
        for (var i = 0; i < 11; i++)
        {
            var emailField = Page.Locator("input[id='email']");
            var passwordField = Page.Locator("input[id='password']");
            await emailField.FillAsync(TestUserUsername);
            await passwordField.FillAsync("wrongpassword");

            var loginButton = Page.Locator("button[type='submit']");
            await loginButton.ClickAsync();

            if (i == 10)
            {
                break;
            }

            await WaitForUrlAsync("user/login**", "Invalid username or password.");
        }

        // Wait for account lockout message.
        await WaitForUrlAsync("user/login**", "locked out");
    }

    /// <summary>
    /// Test if logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    private async Task Login()
    {
        await NavigateUsingBlazorRouter("/");

        // Check that we are on the login page after navigating to the base URL.
        // We are expecting to not be authenticated and thus to be redirected to the login page.
        await WaitForUrlAsync("user/login");

        // Try to login with test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        await emailField.FillAsync(TestUserUsername);
        await passwordField.FillAsync(TestUserPassword);

        // Check if we get redirected when clicking on the login button.
        var loginButton = Page.Locator("button[type='submit']");
        await loginButton.ClickAsync();
        await WaitForUrlAsync(AppBaseUrl, "Welcome to AliasVault");

        // Check if the login was successful by verifying content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Welcome to AliasVault"), "No index content after logging in.");
    }
}
