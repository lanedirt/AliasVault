//-----------------------------------------------------------------------
// <copyright file="BrowserWasmTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard3;

using Microsoft.Extensions.Configuration;
using Microsoft.Playwright;

/// <summary>
/// End-to-end tests for user two-factor authentication.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ClientTests")]
[TestFixture]
public class BrowserWasmTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if setting up two-factor authentication and then logging in works.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task ShowsWarningWhenWebAssemblyNotSupported()
    {
        // Store current browser context and page.
        var originalContext = Context;
        var originalPage = Page;

        try
        {
            // Create a new browser context and page with WebAssembly disabled to test the error message.
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.Development.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();
            bool headless = configuration.GetValue("PlaywrightSettings:Headless", true);
            var playwright = await Playwright.CreateAsync();
            Browser = await playwright.Chromium.LaunchAsync(new()
            {
                Args = ["--js-flags=--noexpose-wasm"],
                Headless = headless,
            });
            Context = await Browser.NewContextAsync();
            Page = await Context.NewPageAsync();

            // Navigate to the app.
            await Page.GotoAsync(AppBaseUrl);

            // Wait for error message to appear.
            var errorMessage = Page.Locator("#error-message");
            await errorMessage.WaitForAsync(new LocatorWaitForOptions
            {
                State = WaitForSelectorState.Visible,
                Timeout = 5000,
            });

            // Verify the error message.
            var message = await errorMessage.TextContentAsync();
            Assert.That(message, Does.Contain("AliasVault requires WebAssembly"));
        }
        finally
        {
            // Clean up the test context and page.
            await Page.CloseAsync();
            await Context.CloseAsync();

            // Restore original context and page for further tests.
            Context = originalContext;
            Page = originalPage;
        }
    }
}
