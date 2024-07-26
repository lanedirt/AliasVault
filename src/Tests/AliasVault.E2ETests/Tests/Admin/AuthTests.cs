//-----------------------------------------------------------------------
// <copyright file="AuthTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Admin;

/// <summary>
/// End-to-end tests for authentication.
/// </summary>
[Parallelizable(ParallelScope.Self)]
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
        await WaitForUrlAsync("account/manage/change-password", "Error: incorrect password.");
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
        await WaitForUrlAsync("account/manage/change-password", "Your password has been changed.");

        // Set new password for next tests.
        TestUserPassword = "newnewnew";

        // Logout.
        await NavigateBrowser("user/logout");
        await WaitForUrlAsync("user/login**", "Sign in to");

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
        // Logout.
        await NavigateBrowser("user/logout");

        // Wait and check if we get redirected to /user/login.
        await WaitForUrlAsync("user/login**", "Sign in to");
    }
}
