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

    /// <summary>
    /// For starting the WebAPI project in-memory.
    /// </summary>
    private WebApplicationFactoryFixture<AliasVaultApiProgram> _factory = new();

    [SetUp]
    public async Task SetUp()
    {
        _webAppManager = new WebAppManager();

        _factory.HostUrl = "http://localhost:5001";
        _factory.CreateDefaultClient();

        //await _webAppManager.StartWebApiAsync(5001);
        await _webAppManager.StartBlazorWasmAsync( 5000);

        var playwright = await Playwright.CreateAsync();
        Browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = false });
        Context = await Browser.NewContextAsync();

        // Intercept requests and override appsettings.json
        await Context.RouteAsync("**/appsettings.json", async route =>
        {
            var response = new
            {
                ApiUrl = "http://localhost:5001"
            };
            await route.FulfillAsync(new RouteFulfillOptions
            {
                ContentType = "application/json",
                Body = System.Text.Json.JsonSerializer.Serialize(response)
            });
        });

        Page = await Context.NewPageAsync();
    }

    [TearDown]
    public async Task TearDown()
    {
        await Page.CloseAsync();
        await Context.CloseAsync();
        await Browser.CloseAsync();

        _factory.Dispose();
        //_webAppManager.StopWebApi();
        _webAppManager.StopBlazorWasm();
    }
}
