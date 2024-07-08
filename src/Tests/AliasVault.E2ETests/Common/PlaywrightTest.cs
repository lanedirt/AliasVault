//-----------------------------------------------------------------------
// <copyright file="PlaywrightTest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Common;

using AliasVault.Shared.Providers.Time;
using Microsoft.Playwright;

/// <summary>
/// Base class for tests that use Playwright for E2E browser testing.
/// </summary>
public class PlaywrightTest
{
    private static readonly object _lock = new();
    private static readonly int _basePort = 5600;
    private static int _currentPort = _basePort;

    /// <summary>
    /// For starting the WebAPI project in-memory.
    /// </summary>
    private readonly WebApplicationApiFactoryFixture<AliasVault.Api.Program> _apiFactory = new();

    /// <summary>
    /// For starting the WASM WebApp project in-memory.
    /// </summary>
    private readonly WebApplicationWasmFactoryFixture<AliasVault.E2ETests.WebApp.Server.Program> _wasmFactory = new();

    /// <summary>
    /// Gets the time provider instance for mutating the current WebApi time in tests.
    /// </summary>
    protected TestTimeProvider ApiTimeProvider => _apiFactory.TimeProvider;

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
    protected IBrowser Browser { get; private set; } = null!;

    /// <summary>
    /// Gets the Playwright browser context.
    /// </summary>
    protected IBrowserContext Context { get; private set; } = null!;

    /// <summary>
    /// Gets the Playwright page.
    /// </summary>
    protected IPage Page { get; private set; } = null!;

    /// <summary>
    /// Gets the input helper for Playwright tests.
    /// </summary>
    protected PlaywrightInputHelper InputHelper { get; private set; } = null!;

    /// <summary>
    /// One time setup for the Playwright test which runs before all tests in the class.
    /// </summary>
    /// <returns>Async task.</returns>
    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        const int maxRetries = 10;
        int currentRetry = 0;

        while (currentRetry < maxRetries)
        {
            try
            {
                await SetupEnvironment();
                await Register();
                return;
            }
            catch (Exception ex)
            {
                currentRetry++;
                Console.WriteLine($"Attempt {currentRetry} failed: {ex.Message}");
                if (currentRetry >= maxRetries)
                {
                    Console.WriteLine($"All {maxRetries} attempts failed. Last exception: {ex}");
                    throw;
                }

                await Task.Delay(500);
            }
        }
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

        await _apiFactory.DisposeAsync();
        await _wasmFactory.DisposeAsync();
    }

    /// <summary>
    /// Navigate to a relative URL using Blazor's client-side router.
    /// </summary>
    /// <param name="relativeUrl">Relative URL.</param>
    /// <returns>Task.</returns>
    protected async Task NavigateUsingBlazorRouter(string relativeUrl)
    {
        // Navigate to the app's base URL initially if not already there
        if (!Page.Url.StartsWith(AppBaseUrl))
        {
            await Page.GotoAsync(AppBaseUrl);

            // Wait for Blazor to load completely
            await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
        }

        // Perform soft navigation within the app
        await Page.EvaluateAsync($"window.blazorNavigate('{relativeUrl}')");
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
    /// Refresh the page which will lock the vault, then enter password to unlock the vault again.
    /// </summary>
    /// <returns>Async task.</returns>
    protected async Task RefreshPageAndUnlockVault()
    {
        // Hard refresh the page.
        await Page.ReloadAsync();

        // Check if the unlock page is displayed.
        await WaitForURLAsync("**/unlock", "unlock");

        // Check if by entering password the unlock page is replaced by the alias listing page.
        await InputHelper.FillInputFields(new Dictionary<string, string>
        {
            { "password", TestUserPassword },
        });

        var submitButton = Page.GetByRole(AriaRole.Button, new() { Name = "Unlock" });
        await submitButton.ClickAsync();
    }

    /// <summary>
    /// Create new credential entry.
    /// </summary>
    /// <param name="formValues">Dictionary with html element ids and values to input as field value.</param>
    /// <returns>Async task.</returns>
    protected async Task CreateCredentialEntry(Dictionary<string, string>? formValues = null)
    {
        await NavigateUsingBlazorRouter("add-credentials");
        await WaitForURLAsync("**/add-credentials", "Add credentials");

        // Check if a button with text "Generate Random Identity" appears
        var generateButton = Page.Locator("text=Generate Random Identity");
        Assert.That(generateButton, Is.Not.Null, "Generate button not found.");

        // Fill all input fields with specified values and remaining empty fields with random data.
        await InputHelper.FillInputFields(formValues);
        await InputHelper.FillEmptyInputFieldsWithRandom();

        var submitButton = Page.Locator("text=Save Credentials").First;
        await submitButton.ClickAsync();
        await WaitForURLAsync("**/credentials/**", "Login credentials");

        // Check if the credential was created
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Login credentials"), "Credential not created.");
    }

    /// <summary>
    /// Register a new random account.
    /// </summary>
    /// <returns>Async task.</returns>
    private async Task Register()
    {
        // Generate random email and password
        TestUserEmail = $"{Guid.NewGuid()}@test.com";
        TestUserPassword = Guid.NewGuid().ToString();

        // Check that we get redirected to /user/login when accessing the root URL and not authenticated.
        await Page.GotoAsync(AppBaseUrl);
        await WaitForURLAsync("**/user/login");

        // Try to register a new account.
        var registerButton = Page.Locator("a[href='/user/register']");
        await registerButton.ClickAsync();
        await WaitForURLAsync("**/user/register");

        // Try to register an account with the generated test credentials.
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
        await WaitForURLAsync(AppBaseUrl, "Find all of your credentials below");
    }

    private async Task SetupEnvironment()
    {
        // Set the base port for the test starting at 5600. Increase the port by 2 for each test running
        // in parallel to avoid port conflicts.
        var apiPort = 0;
        var appPort = 0;
        lock (_lock)
        {
            apiPort = Interlocked.Increment(ref _currentPort);
            appPort = Interlocked.Increment(ref _currentPort);
        }

        AppBaseUrl = "http://localhost:" + appPort + "/";

        // Start WebAPI in-memory.
        _apiFactory.HostUrl = "http://localhost:" + apiPort;
        var apiClient = _apiFactory.CreateDefaultClient();

        // Start Blazor WASM app out-of-process.
        _wasmFactory.HostUrl = "http://localhost:" + appPort;
        var wasmClient = _wasmFactory.CreateDefaultClient();

        // Set Playwright headless mode true if not in debug mode.
        bool isDebugMode = System.Diagnostics.Debugger.IsAttached;
        bool headless = !isDebugMode;

        var playwright = await Playwright.CreateAsync();
        Browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = headless });
        Context = await Browser.NewContextAsync();

        // Intercept Blazor WASM app requests to override appsettings.json
        await Context.RouteAsync(
            "**/appsettings.json",
            async route =>
            {
                var response = new
                {
                    ApiUrl = "http://localhost:" + apiPort,
                };
                await route.FulfillAsync(
                    new RouteFulfillOptions
                    {
                        ContentType = "application/json",
                        Body = System.Text.Json.JsonSerializer.Serialize(response),
                    });
            });
        await Context.RouteAsync(
            "**/appsettings.Development.json",
            async route =>
            {
                var response = new
                {
                    ApiUrl = "http://localhost:" + apiPort,
                };
                await route.FulfillAsync(
                    new RouteFulfillOptions
                    {
                        ContentType = "application/json",
                        Body = System.Text.Json.JsonSerializer.Serialize(response),
                    });
            });

        Page = await Context.NewPageAsync();
        InputHelper = new(Page);

        // Check that we get redirected to /user/login when accessing the root URL and not authenticated.
        await Page.GotoAsync(AppBaseUrl);
        await WaitForURLAsync("**/user/login");
    }
}
