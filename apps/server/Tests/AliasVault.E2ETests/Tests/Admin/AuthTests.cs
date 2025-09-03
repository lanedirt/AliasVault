//-----------------------------------------------------------------------
// <copyright file="AuthTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Admin;

/// <summary>
/// End-to-end tests for authentication.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("AdminTests")]
[TestFixture]
public class AuthTests : AdminPlaywrightTest
{
    /// <summary>
    /// Test if entering a wrong password gives an error during password change.
    /// </summary>
    /// <returns>Async task.</returns>
    [Order(1)]
    [Test]
    public async Task ChangePasswordWrongInputTest()
    {
        // Go to change password page.
        await NavigateBrowser("account/manage/change-password");
        await WaitForUrlAsync("account/manage/change-password", "New password");

        // Fill in the form.
        await Page.Locator("input[id='old-password']").FillAsync("incorrect-old-password");
        await Page.Locator("input[id='new-password']").FillAsync("newnewnew");
        await Page.Locator("input[id='confirm-password']").FillAsync("newnewnew");

        var submitButton = Page.GetByRole(AriaRole.Button, new() { Name = "Update password" });
        await submitButton.ClickAsync();

        // Wait for current page to refresh and confirm message shows.
        await WaitForUrlAsync("account/manage/change-password", "Incorrect");

        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Error: Incorrect password."), "No error shown after submitting change password field with wrong old password.");
    }

    /// <summary>
    /// Test if changing password works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Order(2)]
    [Test]
    public async Task ChangePasswordTest()
    {
        // Go to change password page.
        await NavigateBrowser("account/manage/change-password");
        await WaitForUrlAsync("account/manage/change-password", "New password");

        // Fill in the form.
        await Page.Locator("input[id='old-password']").FillAsync("password");
        await Page.Locator("input[id='new-password']").FillAsync("newnewnew");
        await Page.Locator("input[id='confirm-password']").FillAsync("newnewnew");

        var submitButton = Page.GetByRole(AriaRole.Button, new() { Name = "Update password" });
        await submitButton.ClickAsync();

        // Wait for current page to refresh and confirm message shows.
        await WaitForUrlAsync("account/manage/change-password", "Your password");

        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Your password has been changed."), "No success message shown after successfully changing password.");

        // Set new password for next tests.
        TestUserPassword = "newnewnew";

        // Logout.
        await Logout();
        await LoginAsAdmin();
    }

    /// <summary>
    /// Test if logging out and logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Order(3)]
    [Test]
    public async Task LogoutAndLoginTest()
    {
        await Logout();
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Sign in to"), "No login page visible after logout.");
    }
}
