//-----------------------------------------------------------------------
// <copyright file="AuthTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard4;

using AliasVault.Shared.Models.Enums;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// End-to-end tests for authentication.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ClientTests")]
[TestFixture]
public class AuthTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if initial registration has created an auth log entry.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task RegistrationAuthLog()
    {
        // Check if the registration executed by the test setup method has
        // lead to the creation of an auth log entry in the database.
        var authLogEntry = await ApiDbContext.AuthLogs.FirstOrDefaultAsync(x => x.Username == TestUserUsername && x.EventType == AuthEventType.Register);
        Assert.That(authLogEntry, Is.Not.Null, "Auth log entry not found in database after registration.");

        // Check if the refresh token is stored in the database and its expiration date is set 7 days in the future
        // after registration. The registration page does not have a "Remember me" checkbox, but it is assumed that
        // the device is trusted so the refresh token will be valid for the extended duration: 7 days.
        var refreshToken = await ApiDbContext.AliasVaultUserRefreshTokens.FirstOrDefaultAsync();
        Assert.That(refreshToken, Is.Not.Null, "Refresh token not found in database after login.");
        Assert.That(refreshToken.ExpireDate, Is.EqualTo(refreshToken.CreatedAt.AddDays(7)), "Refresh token expiration date is not 7 days in the future while rememberMe checkbox was checked.");
    }

    /// <summary>
    /// Test if logging out and logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(2)]
    public async Task LogoutAndLoginTest()
    {
        await Logout();
        await Login();

        // Wait for the index page to load which should show "Credentials" in the top menu.
        await WaitForUrlAsync("**", "Credentials");

        // Check if the login was successful by verifying content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(WelcomeMessage), "No index content after logging in.");

        // Check if login has created an auth log entry.
        var authLogEntry = await ApiDbContext.AuthLogs.FirstOrDefaultAsync(x => x.Username == TestUserUsername && x.EventType == AuthEventType.Login);
        Assert.That(authLogEntry, Is.Not.Null, "Auth log entry not found in database after login.");

        // Check if the refresh token is stored in the database and its expiration date is set 4 hours in the future.
        var refreshToken = await ApiDbContext.AliasVaultUserRefreshTokens.FirstOrDefaultAsync();
        Assert.That(refreshToken, Is.Not.Null, "Refresh token not found in database after login.");
        Assert.That(refreshToken.ExpireDate, Is.EqualTo(refreshToken.CreatedAt.AddHours(4)), "Refresh token expiration date is not 4 hours in the future.");
    }

    /// <summary>
    /// Test if logging in with different case variations of username works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(3)]
    public async Task CapitalizedUsernameTest()
    {
        // Logout current user
        await Logout();

        // Create a new user with capital letters in username
        var capitalUsername = "TestUser@Example.com";
        await Register(checkForSuccess: true, username: capitalUsername);
        await Logout();

        // Test Case 1: Try to login with lowercase version of the username
        var lowercaseUsername = capitalUsername.ToLower();
        await LoginWithUsername(lowercaseUsername);
        await VerifySuccessfulLogin();

        // Test Case 2: Try to login with exact capitalized username
        await Logout();
        await LoginWithUsername(capitalUsername);
        await VerifySuccessfulLogin();

        // Test Case 3: Create new user with lowercase
        await Logout();
        var lowercaseUser = "testuser2@example.com";
        await Register(checkForSuccess: true, username: lowercaseUser);
        await Logout();

        // Try logging in with uppercase version
        var uppercaseVersion = lowercaseUser.ToUpper();
        await LoginWithUsername(uppercaseVersion);
        await VerifySuccessfulLogin();
    }

    /// <summary>
    /// Test if logging out and logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(4)]
    public async Task LogoutAndLoginRememberMeTest()
    {
        await Logout();
        await Login(rememberMe: true);

        // Wait for the index page to load which should show "Credentials" in the top menu.
        await WaitForUrlAsync("**", "Credentials");

        // Check if the login was successful by verifying content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(WelcomeMessage), "No index content after logging in.");

        // Check if login has created an auth log entry.
        var authLogEntry = await ApiDbContext.AuthLogs.FirstOrDefaultAsync(x => x.Username == TestUserUsername && x.EventType == AuthEventType.Login);
        Assert.That(authLogEntry, Is.Not.Null, "Auth log entry not found in database after login.");

        // Check if the refresh token is stored in the database and its expiration date is set 7 days in the future
        // because the "Remember me" checkbox was checked.
        var refreshToken = await ApiDbContext.AliasVaultUserRefreshTokens.FirstOrDefaultAsync();
        Assert.That(refreshToken, Is.Not.Null, "Refresh token not found in database after login.");
        Assert.That(refreshToken.ExpireDate, Is.EqualTo(refreshToken.CreatedAt.AddDays(7)), "Refresh token expiration date is not 7 days in the future while rememberMe checkbox was checked.");
    }

    /// <summary>
    /// Test if registering an account with the same email address as an existing account shows a warning.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(5)]
    public async Task RegisterFormWarningTest()
    {
        await Logout();
        await Register(checkForSuccess: false);

        var warning = await Page.TextContentAsync("div[role='alert']");
        Assert.That(warning, Does.Contain("is already taken."), "No visible warning when registering with existing email address.");
    }

    /// <summary>
    /// Test if entering a wrong password too many times locks the account.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(6)]
    public async Task PasswordAuthLockoutTest()
    {
        await Logout();
        await NavigateToLogin();

        // Fill in wrong password 11 times. After 11 times, the account should be locked.
        // Note: the actual lockout happens on the 10th wrong attempt, but the lockout message is only displayed
        // on the next attempt, so we need to try 11 times to see the lockout message.
        for (var i = 0; i < 11; i++)
        {
            var emailField = await WaitForAndGetElement("input[id='email']");
            var passwordField = await WaitForAndGetElement("input[id='password']");
            await emailField.FillAsync(TestUserUsername);
            await passwordField.FillAsync("wrongpassword");

            var loginButton = await WaitForAndGetElement("button[type='submit']");
            await loginButton.ClickAsync();

            if (i == 10)
            {
                break;
            }

            await WaitForUrlAsync("user/login**", "Invalid username or password.");
        }

        // Check if the correct amount of auth failure log entries were created.
        var authLogEntryFailureCount = await ApiDbContext.AuthLogs.CountAsync(x => x.Username == TestUserUsername && x.EventType == AuthEventType.Login && !x.IsSuccess);
        Assert.That(authLogEntryFailureCount, Is.EqualTo(10), "10 failed login attempts did not result in 10 failed auth log records.");

        // Wait for account lockout message.
        await WaitForUrlAsync("user/login**", "locked out");
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("locked out"), "No account lockout message.");
    }

    /// <summary>
    /// Login with a given username.
    /// </summary>
    /// <param name="username">The username to login with.</param>
    /// <returns>Async task.</returns>
    private async Task LoginWithUsername(string username)
    {
        await NavigateToLogin();

        var emailField = await WaitForAndGetElement("input[id='email']");
        var passwordField = await WaitForAndGetElement("input[id='password']");
        await emailField.FillAsync(username);
        await passwordField.FillAsync(TestUserPassword);

        var loginButton = await WaitForAndGetElement("button[type='submit']");
        await loginButton.ClickAsync();
    }

    /// <summary>
    /// Verify that a login was successful.
    /// </summary>
    /// <returns>Async task.</returns>
    private async Task VerifySuccessfulLogin()
    {
        // Wait for the index page to load which should show "Credentials" in the top menu.
        await WaitForUrlAsync("**", "Credentials");

        // Check if the login was successful by verifying content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(WelcomeMessage), "No index content after logging in.");

        // Check if login has created an auth log entry.
        var authLogEntry = await ApiDbContext.AuthLogs.FirstOrDefaultAsync(x =>
            x.EventType == AuthEventType.Login);
        Assert.That(authLogEntry, Is.Not.Null, "Auth log entry not found in database after login.");
    }
}
