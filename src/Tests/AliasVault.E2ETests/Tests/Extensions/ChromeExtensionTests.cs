//-----------------------------------------------------------------------
// <copyright file="ChromeExtensionTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Extensions;

/// <summary>
/// End-to-end tests for the Chrome extension. We extend from ClientPlaywrightTest as extension tess requires
/// mutating things via the client too to test all extension functionality properly such as syncing vaults.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ExtensionTests")]
[TestFixture]
public class ChromeExtensionTests : ClientPlaywrightTest
{
    private string _extensionPath = string.Empty;

    /// <summary>
    /// Tests if the extension can load a vault and a previously created credential entry is present.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task ExtensionCredentialExists()
    {
        // Create a new alias with service name = "Test Service".
        var serviceName = "Test Service";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceName },
        });

        var extensionPopup = await LoginToExtension();

        // Assert extension loaded vault successfully and service name is present.
        await extensionPopup.WaitForSelectorAsync("text=" + serviceName);
        var pageContent = await extensionPopup.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceName));
    }

    /// <summary>
    /// Setup the Playwright browser and context based on settings defined in appsettings.json.
    /// </summary>
    /// <returns>Task.</returns>
    protected override async Task SetupPlaywrightBrowserAndContext()
    {
        // Make sure the extension is built and ready to use.
        ExtensionSetup();

        var playwright = await Playwright.CreateAsync();

        // Launch persistent context with the extension loaded
        Context = await playwright.Chromium.LaunchPersistentContextAsync(
            userDataDir: string.Empty, // Empty string means temporary directory
            new BrowserTypeLaunchPersistentContextOptions
            {
                Headless = false,
                Args = new[]
                {
                    "--disable-extensions-except=" + _extensionPath,
                    "--load-extension=" + _extensionPath,
                },
                ServiceWorkers = ServiceWorkerPolicy.Allow,
            });
    }

    /// <summary>
    /// Find the solution root directory by walking up from the current assembly location.
    /// </summary>
    /// <param name="startPath">The starting directory.</param>
    /// <returns>The solution root directory.</returns>
    private static string FindSolutionRoot(string startPath)
    {
        var directory = new DirectoryInfo(startPath);
        while (directory != null && !File.Exists(Path.Combine(directory.FullName, "AliasVault.sln")))
        {
            directory = directory.Parent;
        }

        if (directory == null)
        {
            throw new DirectoryNotFoundException("Could not find solution root directory");
        }

        return directory.FullName;
    }

    /// <summary>
    /// Sets up the extension by running npm install and build.
    /// </summary>
    private void ExtensionSetup()
    {
        // Get the solution directory by walking up from the current assembly location
        var currentDir = Path.GetDirectoryName(typeof(ChromeExtensionTests).Assembly.Location)
            ?? throw new InvalidOperationException("Current directory not found");
        var solutionDir = FindSolutionRoot(currentDir);

        // Construct absolute path to extension directory
        var extensionDir = Path.GetFullPath(Path.Combine(solutionDir, "browser-extensions", "chrome"));
        var distDir = Path.GetFullPath(Path.Combine(extensionDir, "dist"));
        var manifestPath = Path.Combine(distDir, "manifest.json");

        // Verify the dist directory exists and contains required files
        if (!Directory.Exists(distDir) || !File.Exists(manifestPath))
        {
            throw new ArgumentException($"Chrome extension dist directory and/or manifest.json not found at {distDir}. Please run 'npm install && npm run build' in {extensionDir}.");
        }

        _extensionPath = distDir.Replace(Path.AltDirectorySeparatorChar, Path.DirectorySeparatorChar);
    }

    /// <summary>
    /// Open the extension popup, configure the API URL and login with the test credentials.
    /// </summary>
    /// <returns>Task.</returns>
    private async Task<IPage> LoginToExtension()
    {
        // Use reflection to access the ServiceWorkers property
        List<object> serviceWorkers;
        try
        {
            var serviceWorkersProperty = Context.GetType().GetProperty("ServiceWorkers");
            var serviceWorkersEnumerable = serviceWorkersProperty?.GetValue(Context) as IEnumerable<object>;

            if (serviceWorkersEnumerable == null)
            {
                throw new InvalidOperationException("Could not find extension service workers");
            }

            serviceWorkers = serviceWorkersEnumerable.ToList();
            if (!serviceWorkers.Any())
            {
                throw new InvalidOperationException("No extension service workers found");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to get service workers, check if the extension is loaded properly: {ex.Message}");
            throw;
        }

        // Get the first service worker's URL using reflection
        var firstWorker = serviceWorkers[0];
        var urlProperty = firstWorker.GetType().GetProperty("Url");
        var url = urlProperty?.GetValue(firstWorker) as string;

        var extensionId = url?.Split('/')[2]
            ?? throw new InvalidOperationException("Could not find extension service worker URL");

        // Open popup in a new page
        var extensionPopup = await Context.NewPageAsync();
        await extensionPopup.GotoAsync($"chrome-extension://{extensionId}/index.html");

        // Configure API URL in settings first
        await extensionPopup.ClickAsync("button[id='settings']");

        // Select "Self-hosted" option first
        await extensionPopup.SelectOptionAsync("select", ["custom"]);

        // Fill in the custom URL input that appears
        await extensionPopup.FillAsync("input[id='custom-api-url']", ApiBaseUrl);

        // Go back to main page
        await extensionPopup.ClickAsync("button[id='back']");

        // Test vault loading with username and password
        await extensionPopup.FillAsync("input[type='text']", TestUserUsername);
        await extensionPopup.FillAsync("input[type='password']", TestUserPassword);
        await extensionPopup.ClickAsync("button:has-text('Login')");

        return extensionPopup;
    }
}
