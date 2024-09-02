//-----------------------------------------------------------------------
// <copyright file="AuthPasswordChangeTest.cs" company="lanedirt">
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
public class AuthPasswordChangeTest : ClientPlaywrightTest
{
    /// <summary>
    /// Test if changing password works correctly.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task PasswordChangeTest()
    {
        // Advance time by 1 second manually to ensure the new vault is created in the future.
        ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));

        var serviceNameBefore = "Credential service before";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceNameBefore },
        });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceNameBefore), "Created credential service name does not appear on login page.");

        // Attempt to change password.
        await NavigateUsingBlazorRouter("settings/security/change-password");
        await WaitForUrlAsync("settings/security/change-password", "Current Password");

        // Fill in the form.
        var currentPasswordField = Page.Locator("input[id='currentPassword']");
        var newPasswordField = Page.Locator("input[id='newPassword']");
        var confirmPasswordField = Page.Locator("input[id='newPasswordConfirm']");

        var newPassword = TestUserPassword + "123";

        await currentPasswordField.FillAsync(TestUserPassword);
        await newPasswordField.FillAsync(newPassword);
        await confirmPasswordField.FillAsync(newPassword);

        // Advance time by 1 second manually to ensure the new vault (encrypted with new password) is created in the future.
        ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));

        // Click the change password button.
        var changePasswordButton = Page.Locator("button:has-text('Change Password')");
        await changePasswordButton.ClickAsync();

        // Wait for success message.
        await WaitForUrlAsync("settings/security/change-password**", "Password changed successfully.");

        // Update test user password to new password so next actions will use the new password.
        TestUserPassword = newPassword;

        // Test refresh and unlock with new password.
        await RefreshPageAndUnlockVault();

        // Test logging in again with new password.
        // Logout.
        await NavigateUsingBlazorRouter("user/logout");
        await WaitForUrlAsync("user/logout", "AliasVault");

        // Wait and check if we get redirected to /user/login.
        await WaitForUrlAsync("user/login");

        await Login();

        // Wait for the credentials page to load again.
        await WaitForUrlAsync("credentials**", serviceNameBefore);

        // Check if the service name is still present in the content.
        pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceNameBefore), "Created credential service name does not appear on login page after hard page reload. Check if the database is correctly persisted and then loaded from the server.");
    }

    /// <summary>
    /// Login (again).
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
    }
}
