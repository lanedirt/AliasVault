//-----------------------------------------------------------------------
// <copyright file="AuthTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests;

/// <summary>
/// End-to-end tests for authentication.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class AuthTests : PlaywrightTest
{
    /// <summary>
    /// Test if logging out and logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task LogoutAndLogin()
    {
        // Logout.
        await NavigateUsingBlazorRouter("user/logout");
        await WaitForURLAsync("**/user/logout", "AliasVault");

        // Wait and check if we get redirected to /user/login.
        await WaitForURLAsync("**/user/login");

        await Login();
    }

    /// <summary>
    /// Test if registering an account with the same email address as an existing account shows a warning.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task RegisterFormWarning()
    {
        // Logout.
        await NavigateUsingBlazorRouter("user/logout");
        await WaitForURLAsync("**/user/logout", "AliasVault");

        // Wait and check if we get redirected to /user/login.
        await WaitForURLAsync("**/user/login");

        // Try to register a new account.
        var registerButton = Page.Locator("a[href='/user/register']");
        await registerButton.ClickAsync();
        await WaitForURLAsync("**/user/register");

        // Register account with same test credentials as used in the initial registration bootstrap method.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        var password2Field = Page.Locator("input[id='password2']");
        await emailField.FillAsync(TestUserEmail);
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
    /// Test if logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    private async Task Login()
    {
        await NavigateUsingBlazorRouter("/");

        // Check that we are on the login page after navigating to the base URL.
        // We are expecting to not be authenticated and thus to be redirected to the login page.
        await WaitForURLAsync("**/user/login");

        // Try to login with test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        await emailField.FillAsync(TestUserEmail);
        await passwordField.FillAsync(TestUserPassword);

        // Check if we get redirected when clicking on the login button.
        var loginButton = Page.Locator("button[type='submit']");
        await loginButton.ClickAsync();
        await WaitForURLAsync(AppBaseUrl, "Find all of your credentials below");

        // Check if the login was successful by verifying content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your credentials below"), "No index content after logging in.");
    }
}
