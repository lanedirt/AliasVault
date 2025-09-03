//-----------------------------------------------------------------------
// <copyright file="RecoveryLockoutTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard3;

using AliasVault.E2ETests.Tests.Client.Shard3.Abstracts;

/// <summary>
/// End-to-end tests for user two-factor authentication recovery code lockout behavior.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ClientTests")]
[TestFixture]
public class RecoveryLockoutTests : TwoFactorAuthBase
{
    /// <summary>
    /// Test if entering a wrong two-factor auth code too many times locks the account.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task TwoFactorAuthRecoveryLockoutTest()
    {
        await DisableTwoFactorIfEnabled();
        await EnableTwoFactor();

        await Logout();
        await NavigateToLogin();

        // Wait for the page to fully load.
        await Task.Delay(100);

        var emailField = await WaitForAndGetElement("input[id='email']");
        var passwordField = await WaitForAndGetElement("input[id='password']");
        await emailField.FillAsync(TestUserUsername);
        await passwordField.FillAsync(TestUserPassword);

        var loginButton = await WaitForAndGetElement("button[type='submit']");
        await loginButton.ClickAsync();

        // Check if we get a 2FA code prompt by checking for text "Authenticator code".
        var prompt = await Page.TextContentAsync("label:has-text('Authenticator code')");
        Assert.That(prompt, Does.Contain("Authenticator code"), "No 2FA code prompt displayed.");

        // Click the "log in with a recovery code" button.
        var useRecoveryCodeButton = Page.Locator("button:has-text('log in with a recovery code')");
        await useRecoveryCodeButton.ClickAsync();

        // Fill in wrong recovery code 11 times. After 11 times, the account should be locked.
        // Note: the actual lockout happens on the 10th wrong attempt, but the lockout message is only displayed
        // on the next attempt, so we need to try 11 times to see the lockout message.
        for (var i = 0; i < 11; i++)
        {
            await Page.Locator("input[id='recovery-code']").FillAsync("000000");
            var submitButton = Page.Locator("button[type='submit']");
            await submitButton.ClickAsync();

            if (i == 10)
            {
                break;
            }

            await WaitForUrlAsync("user/login**", "Invalid recovery code.");
        }

        // Wait for account lockout message.
        await WaitForUrlAsync("user/login**", "locked out");
    }
}
