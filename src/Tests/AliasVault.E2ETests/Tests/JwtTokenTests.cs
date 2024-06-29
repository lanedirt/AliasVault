//-----------------------------------------------------------------------
// <copyright file="JwtTokenTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests;

/// <summary>
/// End-to-end tests for JWT token handling.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class JwtTokenTests : PlaywrightTest
{
    /// <summary>
    /// Test that when the JWT token expires the client automatically refreshes it with the refresh token.
    /// </summary>
    /// <returns>Async task.</returns>
    [Order(1)]
    [Test]
    public async Task RefreshTokenTest()
    {
        // Soft navigate to "aliases" page to verify that it works.
        await NavigateUsingBlazorRouter("aliases");
        await WaitForURLAsync("**/aliases", "Find all of your aliases below");

        // Increase the time by 1 hour to make the JWT token expire.
        ApiTimeProvider.AdvanceBy(TimeSpan.FromHours(1));

        // Soft navigate to another page to trigger the JWT token refresh
        // and check if the page is loaded successfully.
        await NavigateUsingBlazorRouter("dbtest");
        await WaitForURLAsync("**/dbtest", "Find all of your aliases below.");

        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your aliases below"), "No index content after unlocking database.");
    }

    /// <summary>
    /// Test that when the JWT token expires the unlock page logic still works where if the
    /// user enters the master key password they are logged in again without errors.
    /// </summary>
    /// <returns>Async task.</returns>
    [Order(2)]
    [Test]
    public async Task RefreshTokenUnlockPageTest()
    {
        // Soft navigate to "aliases" page to verify that it works.
        var startUrl = "dbtest";
        await NavigateUsingBlazorRouter(startUrl);
        await WaitForURLAsync("**/" + startUrl, "Find all of your aliases below");

        // Hard reload the page to trigger the unlock page to show up.
        await Page.ReloadAsync();
        await WaitForURLAsync("**/unlock", "unlock");

        // Increase the time by 24 hours to make the JWT token expire.
        ApiTimeProvider.AdvanceBy(TimeSpan.FromHours(24));

        // Check if by entering password the JWT token is refreshed and the
        // unlock page is replaced by the alias listing page.
        await InputHelper.FillInputFields(new Dictionary<string, string>
        {
            { "password", TestUserPassword },
        });

        var submitButton = Page.GetByRole(AriaRole.Button, new() { Name = "Unlock" });
        await submitButton.ClickAsync();

        // Check if we get redirected back to the page we were trying to access.
        await WaitForURLAsync("**/" + startUrl, "AliasVault");

        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Find all of your aliases below"), "No index content after unlocking database with a expired JWT token.");
    }

    /// <summary>
    /// Test that when the refresh token expires the client automatically logs out the user.
    /// </summary>
    /// <returns>Async task.</returns>
    [Order(3)]
    [Test]
    public async Task RefreshTokenExpiredTest()
    {
        // Soft navigate to "aliases" page to verify that it works.
        await NavigateUsingBlazorRouter("aliases");
        await WaitForURLAsync("**/aliases", "Find all of your aliases below");

        // Increase the time by 1 year to make the JWT token AND refresh token expire.
        ApiTimeProvider.AdvanceBy(TimeSpan.FromDays(365));

        // Soft navigate to another page to trigger the JWT token refresh
        // and check if the page is loaded successfully.
        // Not all pages do a webapi call on load everytime so we need to navigate to a page that does.
        await NavigateUsingBlazorRouter("dbtest");
        await NavigateUsingBlazorRouter("aliases");
        await NavigateUsingBlazorRouter("dbtest");

        await WaitForURLAsync("**/user/login", "Login");

        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Login"), "No redirect to login while refresh token should be expired.");
    }
}
