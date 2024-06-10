using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AliasVault.E2ETests;

using Microsoft.Playwright;

public class PlaywrightTest
{
    protected IBrowser Browser { get; private set; }
    protected IBrowserContext Context { get; private set; }
    protected IPage Page { get; private set; }

    private WebAppManager _webAppManager;

    protected string _randomEmail = "";
    protected string _randomPassword = "";
    protected int apiPort = 5001;
    protected int appPort = 5000;
    protected string _appBaseUrl = "http://localhost:5000/";

    /// <summary>
    /// For starting the WebAPI project in-memory.
    /// </summary>
    private WebApplicationFactoryFixture<AliasVaultApiProgram> _factory = new();

    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        _webAppManager = new WebAppManager();

        // Determine random port for the WebAPI between 5000-5500
        apiPort = new Random().Next(5000, 5500);
        // Determine random port for the BlazorWasm which is apiPort + 1
        appPort = apiPort + 1;
        // Update base URL
        _appBaseUrl = "http://localhost:" + appPort + "/";

        _factory.HostUrl = "http://localhost:" + apiPort;
        _factory.CreateDefaultClient();

        //await _webAppManager.StartWebApiAsync(5001);
        await _webAppManager.StartBlazorWasmAsync(appPort);

        var playwright = await Playwright.CreateAsync();
        Browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
        Context = await Browser.NewContextAsync();

        // Intercept requests and override appsettings.json
        await Context.RouteAsync("**/appsettings.json", async route =>
        {
            var response = new
            {
                ApiUrl = "http://localhost:" + apiPort
            };
            await route.FulfillAsync(new RouteFulfillOptions
            {
                ContentType = "application/json",
                Body = System.Text.Json.JsonSerializer.Serialize(response)
            });
        });

        Page = await Context.NewPageAsync();

        // Register a new account via the UI
        await Register();
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        await Page.CloseAsync();
        await Context.CloseAsync();
        await Browser.CloseAsync();

        _factory.Dispose();
        //_webAppManager.StopWebApi();
        _webAppManager.StopBlazorWasm();
    }

    /// <summary>
    /// Register a new random account.
    /// </summary>
    public async Task Register()
    {
        // Generate random email and password
        _randomEmail = $"{Guid.NewGuid().ToString()}@test.com";
        _randomPassword = Guid.NewGuid().ToString();

        await Page.GotoAsync(_appBaseUrl);
        var navigationTask = Page.WaitForNavigationAsync();
        await navigationTask;

        // Check that we got redirected to /user/login
        var currentUrl = Page.Url;
        Assert.That(currentUrl, Is.EqualTo(_appBaseUrl + "user/login"));

        // Try to register a new account.
        var registerButton = Page.Locator("a[href='/user/register']");
        navigationTask = Page.WaitForNavigationAsync(new PageWaitForNavigationOptions() { Timeout = 2000 });
        await registerButton.ClickAsync();
        await navigationTask;

        // Try to login with test credentials.
        var emailField = Page.Locator("input[id='email']");
        var passwordField = Page.Locator("input[id='password']");
        var password2Field = Page.Locator("input[id='password2']");
        await emailField.FillAsync(_randomEmail);
        await passwordField.FillAsync(_randomPassword);
        await password2Field.FillAsync(_randomPassword);

        // Check the terms of service checkbox
        var termsCheckbox = Page.Locator("input[id='terms']");
        await termsCheckbox.CheckAsync();

        // Check if we get redirected when clicking on the register button.
        var submitButton = Page.Locator("button[type='submit']");
        navigationTask = Page.WaitForNavigationAsync(new PageWaitForNavigationOptions() { Timeout = 200000});
        await submitButton.ClickAsync();
        await navigationTask;

        // Check if the redirection occurred
        currentUrl = Page.Url;
        Assert.That(currentUrl, Is.EqualTo(_appBaseUrl));
    }
}
