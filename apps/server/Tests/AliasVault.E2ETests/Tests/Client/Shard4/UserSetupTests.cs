//-----------------------------------------------------------------------
// <copyright file="UserSetupTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard4;

/// <summary>
/// End-to-end tests for the registration process via the wizard / tutorial interface (/user/setup).
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ClientTests")]
[TestFixture]
public class UserSetupTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if registering an account through the tutorial interface works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task UserSetupProcessTest()
    {
        // Logout.
        await Logout();
        await Page.GotoAsync(AppBaseUrl);
        await WaitForUrlAsync("user/start", "Create new vault");

        // Click the "Create new vault" anchor tag.
        var createVaultButton = await WaitForAndGetElement("a:has-text('Create new vault')");
        await createVaultButton.ClickAsync();

        // Wait for the terms and conditions to load.
        await WaitForUrlAsync("user/setup", "Terms and Conditions");

        // Accept the terms and conditions.
        var acceptTermsCheckbox = await WaitForAndGetElement("input[id='agreeTerms']");
        await acceptTermsCheckbox.CheckAsync();

        // Wait for the continue button to be enabled.
        await Task.Delay(100);

        // Press the continue button.
        var continueButton = await WaitForAndGetElement("button:has-text('Continue')");
        await continueButton.ClickAsync();

        // Wait for the username step to load.
        await WaitForUrlAsync("user/setup", "Username");
        var usernameField = await WaitForAndGetElement("input[id='username']");
        await usernameField.FillAsync(TestUserUsername + "1"); // Add a suffix to the username to make it unique.

        // Wait for the continue button to be enabled.
        await Task.Delay(100);

        // Press the continue button.
        continueButton = await WaitForAndGetElement("button:has-text('Continue')");
        await continueButton.ClickAsync();

        // Wait for the password step to load.
        await WaitForUrlAsync("user/setup", "Set Password");
        var passwordField = await WaitForAndGetElement("input[id='password']");
        await passwordField.FillAsync(TestUserPassword);
        var confirmPasswordField = await WaitForAndGetElement("input[id='confirmPassword']");
        await confirmPasswordField.FillAsync(TestUserPassword);

        // Wait for the create account button to show up and be enabled.
        await Task.Delay(100);

        // Press the create account button.
        continueButton = await WaitForAndGetElement("button:has-text('Create Account')");
        await continueButton.ClickAsync();

        // Verify that we end up on the welcome page which confirms the account has been successfully created.
        await WaitForUrlAsync("welcome**", WelcomeMessage);
    }

    /// <summary>
    /// Test if the "Username is already in use" error appears when trying to register with an existing username.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(2)]
    public async Task UserSetupUsernameExistsTest()
    {
        // Logout.
        await Logout();
        await Page.GotoAsync(AppBaseUrl);
        await WaitForUrlAsync("user/start", "Create new vault");

        // Click the "Create new vault" anchor tag.
        var createVaultButton = await WaitForAndGetElement("a:has-text('Create new vault')");
        await createVaultButton.ClickAsync();

        // Wait for the terms and conditions to load.
        await WaitForUrlAsync("user/setup", "Terms and Conditions");

        // Accept the terms and conditions.
        var acceptTermsCheckbox = await WaitForAndGetElement("input[id='agreeTerms']");
        await acceptTermsCheckbox.CheckAsync();

        // Wait for the continue button to be enabled.
        await Task.Delay(100);

        // Press the continue button.
        var continueButton = await WaitForAndGetElement("button:has-text('Continue')");
        await continueButton.ClickAsync();

        // Wait for the username step to load.
        await WaitForUrlAsync("user/setup", "Username");
        var usernameField = await WaitForAndGetElement("input[id='username']");
        await usernameField.FillAsync(TestUserUsername); // Use the existing username without appending "1"

        // Check if the "Username is already in use" error message appears
        var errorMessage = await WaitForAndGetElement("text='Username is already in use.'");
        Assert.That(errorMessage, Is.Not.Null, "The 'Username is already in use' error message should appear.");
    }

    /// <summary>
    /// Test if the "Username too short" and "Username too long" error appears when trying to register with an invalid username.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(3)]
    public async Task UserSetupUsernameLengthTest()
    {
        // Logout.
        await Logout();
        await Page.GotoAsync(AppBaseUrl);
        await WaitForUrlAsync("user/start", "Create new vault");

        // Click the "Create new vault" anchor tag.
        var createVaultButton = await WaitForAndGetElement("a:has-text('Create new vault')");
        await createVaultButton.ClickAsync();

        // Wait for the terms and conditions to load.
        await WaitForUrlAsync("user/setup", "Terms and Conditions");

        // Accept the terms and conditions.
        var acceptTermsCheckbox = await WaitForAndGetElement("input[id='agreeTerms']");
        await acceptTermsCheckbox.CheckAsync();

        // Wait for the continue button to be enabled.
        await Task.Delay(100);

        // Press the continue button.
        var continueButton = await WaitForAndGetElement("button:has-text('Continue')");
        await continueButton.ClickAsync();

        // Wait for the username step to load.
        await WaitForUrlAsync("user/setup", "Username");
        var usernameField = await WaitForAndGetElement("input[id='username']");
        await usernameField.FillAsync("ts"); // Too short username (2 chars)

        // Check if the "Username is too short" error message appears
        var errorMessage = await WaitForAndGetElement("text='Username too short: must be at least 3 characters long.'");
        Assert.That(errorMessage, Is.Not.Null, "The 'Username too short' error message should appear.");

        // Clear the username field.
        await usernameField.FillAsync(string.Empty);

        // Fill in a too long username (41 chars).
        await usernameField.FillAsync("asdasdasdasdasdasdasdasdasdaaaasasddsdasd"); // Too long username (41 chars)

        // Check if the "Username is too short" error message appears
        errorMessage = await WaitForAndGetElement("text='Username too long: cannot be longer than 40 characters.'");
        Assert.That(errorMessage, Is.Not.Null, "The 'Username too long' error message should appear.");
    }
}
