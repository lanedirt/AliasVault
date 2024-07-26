//-----------------------------------------------------------------------
// <copyright file="ClientPlaywrightTest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Common;

using AliasServerDb;
using AliasVault.Shared.Providers.Time;
using Microsoft.Playwright;

/// <summary>
/// Base class for tests that use Playwright for E2E browser testing.
/// </summary>
public class ClientPlaywrightTest : PlaywrightTest
{
    private static readonly int _basePort = 5600;
    private static int _currentPort = _basePort;

    /// <summary>
    /// For starting the WebAPI project in-memory.
    /// </summary>
    private readonly WebApplicationApiFactoryFixture<AliasVault.Api.Program> _apiFactory = new();

    /// <summary>
    /// For starting the Client project in-memory.
    /// </summary>
    private readonly WebApplicationClientFactoryFixture<AliasVault.E2ETests.Client.Server.Program> _clientFactory = new();

    /// <summary>
    /// Gets the time provider instance for mutating the current WebApi time in tests.
    /// </summary>
    protected TestTimeProvider ApiTimeProvider => _apiFactory.TimeProvider;

    /// <summary>
    /// Gets the db context for the WebAPI project.
    /// </summary>
    protected AliasServerDbContext ApiDbContext => _apiFactory.GetDbContext();

    /// <summary>
    /// Gets or sets the base URL where the WebAPI project runs on including random port.
    /// </summary>
    protected string ApiBaseUrl { get; set; } = string.Empty;

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
        await _clientFactory.DisposeAsync();
    }

    /// <summary>
    /// Setup the Playwright test environment.
    /// </summary>
    /// <returns>Async task.</returns>
    protected override async Task SetupEnvironment()
    {
        // Set the base port for the test starting at 5600. Increase the port by 2 for each test running
        // in parallel to avoid port conflicts.
        int apiPort;
        int appPort;
        lock (Lock)
        {
            apiPort = Interlocked.Increment(ref _currentPort);
            appPort = Interlocked.Increment(ref _currentPort);
        }

        AppBaseUrl = "http://localhost:" + appPort + "/";
        ApiBaseUrl = "http://localhost:" + apiPort + "/";

        // Start WebAPI in-memory.
        _apiFactory.HostUrl = "http://localhost:" + apiPort;
        _apiFactory.CreateDefaultClient();

        // Start Blazor WASM in-memory.
        _clientFactory.HostUrl = "http://localhost:" + appPort;
        _clientFactory.CreateDefaultClient();

        await SetupPlaywrightBrowserAndContext();

        // Intercept Blazor WASM app requests to override appsettings.json
        await Context.RouteAsync(
            "**/appsettings.json",
            async route =>
            {
                var response = new
                {
                    ApiUrl = ApiBaseUrl.TrimEnd('/'),
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
                    ApiUrl = ApiBaseUrl.TrimEnd('/'),
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
        await WaitForUrlAsync("user/login");

        // Register a new account here because every test requires this.
        await Register();
    }

    /// <summary>
    /// Refresh the page which will lock the vault, then enter password to unlock the vault again.
    /// </summary>
    /// <returns>Async task.</returns>
    protected async Task RefreshPageAndUnlockVault()
    {
        // Get current URL.
        var currentUrl = Page.Url;

        // Hard refresh the page.
        await Page.ReloadAsync();

        // Check if the unlock page is displayed.
        await WaitForUrlAsync("unlock", "unlock");

        // Check if by entering password the unlock page is replaced by the alias listing page.
        await InputHelper.FillInputFields(new Dictionary<string, string>
        {
            { "password", TestUserPassword },
        });

        var submitButton = Page.GetByRole(AriaRole.Button, new() { Name = "Unlock" });
        await submitButton.ClickAsync();

        // Wait for the original page to load again.
        await WaitForUrlAsync(currentUrl);
    }

    /// <summary>
    /// Create new credential entry.
    /// </summary>
    /// <param name="formValues">Dictionary with html element ids and values to input as field value.</param>
    /// <returns>Async task.</returns>
    protected async Task CreateCredentialEntry(Dictionary<string, string>? formValues = null)
    {
        await NavigateUsingBlazorRouter("add-credentials");
        await WaitForUrlAsync("add-credentials", "Add credentials");

        // Check if a button with text "Generate Random Identity" appears
        var generateButton = Page.Locator("text=Generate Random Identity");
        Assert.That(generateButton, Is.Not.Null, "Generate button not found.");

        // Fill all input fields with specified values and remaining empty fields with random data.
        await InputHelper.FillInputFields(formValues);
        await InputHelper.FillEmptyInputFieldsWithRandom();

        var submitButton = Page.Locator("text=Save Credentials").First;
        await submitButton.ClickAsync();
        await WaitForUrlAsync("credentials/**", "Login credentials");

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
        // If email is not set by test explicitly, generate a random email.
        TestUserUsername = TestUserUsername.Length > 0 ? TestUserUsername : $"{Guid.NewGuid()}@test.com";

        // If password is not set by test explicitly, generate a random password.
        TestUserPassword = TestUserPassword.Length > 0 ? TestUserPassword : Guid.NewGuid().ToString();

        // Try to register a new account.
        var registerButton = Page.Locator("a[href='/user/register']");
        await registerButton.ClickAsync();
        await WaitForUrlAsync("user/register");

        // Try to register an account with the generated test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        var password2Field = Page.Locator("input[id='password2']");
        await emailField.FillAsync(TestUserUsername);
        await passwordField.FillAsync(TestUserPassword);
        await password2Field.FillAsync(TestUserPassword);

        // Check the terms of service checkbox
        var termsCheckbox = Page.Locator("input[id='terms']");
        await termsCheckbox.CheckAsync();

        // Check if we get redirected when clicking on the register button.
        var submitButton = Page.Locator("button[type='submit']");
        await submitButton.ClickAsync();

        // Check if we get redirected to the root URL after registration which means we are logged in.
        await WaitForUrlAsync(AppBaseUrl, "Find all of your credentials below");
    }
}
