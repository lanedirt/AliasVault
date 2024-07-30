//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasVault.Client;
using AliasVault.Client.Providers;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.HostEnvironment.Environment}.json", optional: true, reloadOnChange: true);

var config = new Config();
builder.Configuration.Bind(config);
if (string.IsNullOrEmpty(config.ApiUrl))
{
    throw new KeyNotFoundException("ApiUrl is not set in the configuration.");
}

if (config.SmtpAllowedDomains == null || config.SmtpAllowedDomains.Count == 0)
{
    throw new KeyNotFoundException("SmtpAllowedDomains is not set in the configuration.");
}

builder.Services.AddSingleton(config);

builder.Services.AddLogging(logging =>
{
    if (builder.HostEnvironment.IsDevelopment())
    {
        logging.SetMinimumLevel(LogLevel.Debug);
    }
    else
    {
        logging.SetMinimumLevel(LogLevel.Warning);
    }

    logging.AddFilter("Microsoft.AspNetCore.Identity.DataProtectorTokenProvider", LogLevel.Error);
    logging.AddFilter("Microsoft.AspNetCore.Identity.UserManager", LogLevel.Error);
});

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");
builder.Services.AddHttpClient("AliasVault.Api").AddHttpMessageHandler<AliasVaultApiHandlerService>();
builder.Services.AddScoped(sp =>
{
    var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient("AliasVault.Api");
    if (builder.Configuration["ApiUrl"] is null)
    {
        throw new InvalidOperationException("The 'ApiUrl' configuration value is required.");
    }

    httpClient.BaseAddress = new Uri(builder.Configuration["ApiUrl"]!);
    return httpClient;
});
builder.Services.AddTransient<AliasVaultApiHandlerService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuthenticationStateProvider, AuthStateProvider>();
builder.Services.AddScoped<CredentialService>();
builder.Services.AddScoped<DbService>();
builder.Services.AddScoped<GlobalNotificationService>();
builder.Services.AddScoped<GlobalLoadingService>();
builder.Services.AddScoped<JsInteropService>();
builder.Services.AddSingleton<ClipboardCopyService>();

builder.Services.AddAuthorizationCore();
builder.Services.AddBlazoredLocalStorage();
await builder.Build().RunAsync();
