//-----------------------------------------------------------------------
// <copyright file="TwoFactorAuthTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client;

/// <summary>
/// End-to-end tests for user two-factor authentication.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ClientTests")]
[TestFixture]
public class TwoFactorAuthTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if setting up two factor authentication and then logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task Setup2FactorAuthAndLogin()
    {
        // Setup two factor auth.
        await NavigateUsingBlazorRouter("settings/security");
        await WaitForUrlAsync("settings/security", "Two-factor Authentication");

        // Press the enable button with text "Enable Two-Factor Authentication"
        var enableButton = Page.Locator("button:has-text('Enable Two-Factor Authentication')");
        await enableButton.ClickAsync();

        // Wait for the secret to be displayed with ID "authenticator-secret"
        var secretElement = Page.Locator("div[id='authenticator-secret']");
        await secretElement.WaitForAsync(new LocatorWaitForOptions
        {
            State = WaitForSelectorState.Visible,
            Timeout = 5000,
        });

        var secret = await Page.TextContentAsync("div[id='authenticator-secret']");
        Assert.That(secret, Is.Not.Null.Or.Empty, "No secret displayed.");

        // Verify that a QR code image is displayed: #qrcode-authenticator-uri > img
        var qrCode = await Page.Locator("#qrcode-authenticator-uri img").GetAttributeAsync("src");
        Assert.That(qrCode, Does.Contain("data:image/png;base64"), "No QR code displayed.");

        // Generate a 2FA code using the secret.
        var totpCode = TotpGenerator.TotpGenerator.GenerateTotpCode(secret);
        Assert.That(totpCode, Is.Not.Null.Or.Empty, "No 2FA code generated.");

        // Fill in the 2FA code and submit the form.
        var totpField = Page.Locator("input[id='verificationCode']");
        await totpField.FillAsync(totpCode);

        var submitButton = Page.Locator("button:has-text('Verify and Enable')");
        await submitButton.ClickAsync();

        // Check if the success message is displayed.
        var successMessage = Page.Locator("div[role='alert']");
        await successMessage.WaitForAsync(new LocatorWaitForOptions
        {
            State = WaitForSelectorState.Visible,
            Timeout = 5000,
        });
        var message = await Page.TextContentAsync("div[role='alert']");
        Assert.That(message, Does.Contain("Two-factor authentication is now successfully enabled."), "No success message displayed.");

        // Logout.
        await NavigateUsingBlazorRouter("user/logout");
        await WaitForUrlAsync("user/login", "AliasVault");

        // Attempt to login again with test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        await emailField.FillAsync(TestUserUsername);
        await passwordField.FillAsync(TestUserPassword);

        var loginButton = Page.Locator("button[type='submit']");
        await loginButton.ClickAsync();

        // Check if we get a 2FA code prompt by checking for text "Authenticator code".
        var prompt = await Page.TextContentAsync("label:has-text('Authenticator code')");
        Assert.That(prompt, Does.Contain("Authenticator code"), "No 2FA code prompt displayed.");

        // Generate a 2FA code using the secret.
        totpCode = TotpGenerator.TotpGenerator.GenerateTotpCode(secret);
        Assert.That(totpCode, Is.Not.Null.Or.Empty, "No 2FA code generated.");

        // Fill in the 2FA code and submit the form.
        totpField = Page.Locator("input[id='two-factor-code']");
        await totpField.FillAsync(totpCode);

        submitButton = Page.Locator("button[type='submit']");
        await submitButton.ClickAsync();

        // Check if we get redirected to the index page.
        await WaitForUrlAsync(AppBaseUrl, "Welcome to AliasVault");
    }
}
