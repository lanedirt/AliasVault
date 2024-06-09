namespace AliasVault.E2ETests;

using Microsoft.Playwright;

public class PlaywrightTest
{
    protected IBrowser Browser { get; private set; }
    protected IBrowserContext Context { get; private set; }
    protected IPage Page { get; private set; }

    [SetUp]
    public async Task SetUp()
    {
        var playwright = await Playwright.CreateAsync();
        Browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
        Context = await Browser.NewContextAsync();
        Page = await Context.NewPageAsync();
    }

    [TearDown]
    public async Task TearDown()
    {
        await Page.CloseAsync();
        await Context.CloseAsync();
        await Browser.CloseAsync();
    }
}
