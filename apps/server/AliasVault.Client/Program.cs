//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasVault.Client;
using AliasVault.Client.Main.Services;
using AliasVault.Client.Providers;
using AliasVault.RazorComponents.Services;
using AliasVault.Shared.Core;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.HostEnvironment.Environment}.json", optional: true, reloadOnChange: true);

var config = new Config();
builder.Configuration.Bind(config);

if (config.PrivateEmailDomains == null || config.PrivateEmailDomains.Count == 0)
{
    throw new KeyNotFoundException("PrivateEmailDomains is not set in the configuration.");
}

builder.Services.AddSingleton(config);

builder.Services.AddLogging(logging =>
{
    if (builder.HostEnvironment.IsDevelopment())
    {
        logging.SetMinimumLevel(LogLevel.Trace);
    }
    else
    {
        logging.SetMinimumLevel(LogLevel.Warning);
    }

    logging.AddFilter("Microsoft.AspNetCore.Identity.DataProtectorTokenProvider", LogLevel.Error);
    logging.AddFilter("Microsoft.AspNetCore.Identity.UserManager", LogLevel.Error);
    logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Error);
});

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");
builder.Services.AddHttpClient("AliasVault.Api").AddHttpMessageHandler<AliasVaultApiHandlerService>();
builder.Services.AddScoped(sp =>
{
    var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient("AliasVault.Api");
    var apiConfig = sp.GetRequiredService<Config>();

    // If API URL is not set, use the current base URL and append "/api" which is the default for the Docker setup.
    // If API URL override is set (used e.g. in dev), then ensure the API URL ends with a forward slash.
    var baseUrl = string.IsNullOrEmpty(apiConfig.ApiUrl) ? builder.HostEnvironment.BaseAddress + "api/" : apiConfig.ApiUrl.TrimEnd('/') + "/";
    httpClient.BaseAddress = new Uri(baseUrl);

    // Add client header.
    httpClient.DefaultRequestHeaders.Add("X-AliasVault-Client", "web-" + AppInfo.GetFullVersion());

    return httpClient;
});
builder.Services.AddTransient<AliasVaultApiHandlerService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserRegistrationService>();
builder.Services.AddScoped<AuthenticationStateProvider, AuthStateProvider>();
builder.Services.AddScoped<CredentialService>();
builder.Services.AddScoped<DbService>();
builder.Services.AddScoped<GlobalNotificationService>();
builder.Services.AddScoped<GlobalLoadingService>();
builder.Services.AddScoped<MinDurationLoadingService>();
builder.Services.AddScoped<KeyboardShortcutService>();
builder.Services.AddScoped<JsInteropService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddSingleton<ClipboardCopyService>();
builder.Services.AddScoped<ConfirmModalService>();
builder.Services.AddScoped<QuickCreateStateService>();

builder.Services.AddAuthorizationCore();
builder.Services.AddBlazoredLocalStorage();
await builder.Build().RunAsync();
