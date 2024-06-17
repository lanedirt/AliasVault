//-----------------------------------------------------------------------
// <copyright file="PlaywrightTest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Common;

using Microsoft.Playwright;

/// <summary>
/// Base class for tests that use Playwright for E2E browser testing.
/// </summary>
public class PlaywrightTest
{
    /// <summary>
    /// For starting the WebAPI project in-memory.
    /// </summary>
    private readonly WebApplicationFactoryFixture<AliasVault.Api.Program> _factory = new();

    /// <summary>
    /// The BlazorWasmAppManager instance.
    /// </summary>
    private BlazorWasmAppManager _blazorWasmAppManager;

    /// <summary>
    /// Gets or sets base URL where the Blazor WASM app runs on including random port.
    /// </summary>
    protected string AppBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets random unique account email that is used for the test.
    /// </summary>
    protected string TestUserEmail { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets random unique account password that is used for the test.
    /// </summary>
    protected string TestUserPassword { get; set; } = string.Empty;

    /// <summary>
    /// Gets the Playwright browser instance.
    /// </summary>
    protected IBrowser Browser { get; private set; }

    /// <summary>
    /// Gets the Playwright browser context.
    /// </summary>
    protected IBrowserContext Context { get; private set; }

    /// <summary>
    /// Gets the Playwright page.
    /// </summary>
    protected IPage Page { get; private set; }

    /// <summary>
    /// One time setup for the Playwright test which runs before all tests in the class.
    /// </summary>
    /// <returns>Async task.</returns>
    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        // Determine random port for the WebAPI between 5100-5900. The WASM app will run on the next port.
        var apiPort = new Random().Next(5100, 5900);
        var appPort = apiPort + 1;
        AppBaseUrl = "http://localhost:" + appPort + "/";

        // Start WebAPI in-memory.
        _factory.HostUrl = "http://localhost:" + apiPort;
        _factory.CreateDefaultClient();

        // Start Blazor WASM app out-of-process.
        _blazorWasmAppManager = new BlazorWasmAppManager();
        await _blazorWasmAppManager.StartBlazorWasmAsync(appPort);

        // Set Playwright headless mode true if not in debug mode.
        bool isDebugMode = System.Diagnostics.Debugger.IsAttached;
        bool headless = !isDebugMode;

        var playwright = await Playwright.CreateAsync();
        Browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = headless });
        Context = await Browser.NewContextAsync();

        // Intercept Blazor WASM app requests to override appsettings.json
        await Context.RouteAsync("**/appsettings.json", async route =>
        {
            var response = new
            {
                ApiUrl = "http://localhost:" + apiPort,
            };
            await route.FulfillAsync(new RouteFulfillOptions
            {
                ContentType = "application/json",
                Body = System.Text.Json.JsonSerializer.Serialize(response),
            });
        });

        Page = await Context.NewPageAsync();

        // Register a new account via the UI
        await Register();
    }

    /// <summary>
    /// Tear down the Playwright test which runs after all tests are done in the class.
    /// </summary>
    /// <returns>Async task.</returns>
    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        await Page.CloseAsync();
        await Context.CloseAsync();
        await Browser.CloseAsync();

        await _factory.DisposeAsync();
        _blazorWasmAppManager.StopBlazorWasm();
    }

    /// <summary>
    /// Wait for the specified URL to be loaded with a default timeout.
    /// </summary>
    /// <param name="url">The URL to wait for. This may also contains wildcard such as "**/user/login".</param>
    /// <returns>Async task.</returns>
    protected async Task WaitForURLAsync(string url)
    {
        await Page.WaitForURLAsync(url, new PageWaitForURLOptions() { Timeout = TestDefaults.DefaultTimeout });
    }

    /// <summary>
    /// Wait for the specified URL to be loaded with a custom timeout.
    /// </summary>
    /// <param name="url">The URL to wait for. This may also contains wildcard such as "**/user/login".</param>
    /// <param name="timeoutInMs">Custom timeout in milliseconds.</param>
    /// <returns>Async task.</returns>
    protected async Task WaitForURLAsync(string url, int timeoutInMs)
    {
        await Page.WaitForURLAsync(url, new PageWaitForURLOptions() { Timeout = timeoutInMs });
    }

    /// <summary>
    /// Wait for the specified URL to be loaded with a custom timeout.
    /// </summary>
    /// <param name="url">The URL to wait for. This may also contains wildcard such as "**/user/login".</param>
    /// <param name="waitForText">Wait until a certain text appears on the page.
    /// This can be useful for content that is loaded via AJAX after navigation.</param>
    /// <returns>Async task.</returns>
    protected async Task WaitForURLAsync(string url, string waitForText)
    {
        await Page.WaitForURLAsync(url, new PageWaitForURLOptions() { Timeout = TestDefaults.DefaultTimeout });

        // Wait for actual content to load (web API calls, etc.)
        await Page.WaitForSelectorAsync("text=" + waitForText, new PageWaitForSelectorOptions() { Timeout = TestDefaults.DefaultTimeout });
    }

    /// <summary>
    /// Register a new random account.
    /// </summary>
    /// <returns>Async task.</returns>
    private async Task Register()
    {
        // Generate random email and password
        TestUserEmail = $"{Guid.NewGuid().ToString()}@test.com";
        TestUserPassword = Guid.NewGuid().ToString();

        // Check that we get redirected to /user/login when accessing the root URL and not authenticated.
        await Page.GotoAsync(AppBaseUrl);
        await WaitForURLAsync("**/user/login", 20000);

        // Try to register a new account.
        var registerButton = Page.Locator("a[href='/user/register']");
        await registerButton.ClickAsync();
        await WaitForURLAsync("**/user/register");

        // Try to login with test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        var password2Field = Page.Locator("input[id='password2']");
        await emailField.FillAsync(TestUserEmail);
        await passwordField.FillAsync(TestUserPassword);
        await password2Field.FillAsync(TestUserPassword);

        // Check the terms of service checkbox
        var termsCheckbox = Page.Locator("input[id='terms']");
        await termsCheckbox.CheckAsync();

        // Check if we get redirected when clicking on the register button.
        var submitButton = Page.Locator("button[type='submit']");
        await submitButton.ClickAsync();

        // Check if we get redirected to the root URL after registration which means we are logged in.
        await WaitForURLAsync(AppBaseUrl);
    }
}
