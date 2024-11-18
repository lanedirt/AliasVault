//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Globalization;
using System.Reflection;
using AliasServerDb;
using AliasServerDb.Configuration;
using AliasVault.Admin;
using AliasVault.Admin.Auth.Providers;
using AliasVault.Admin.Main;
using AliasVault.Admin.Services;
using AliasVault.Auth;
using AliasVault.Cryptography.Server;
using AliasVault.Logging;
using AliasVault.RazorComponents.Services;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
builder.Services.ConfigureLogging(builder.Configuration, Assembly.GetExecutingAssembly().GetName().Name!, "../../logs");

// Create global config object, get values from environment variables.
Config config = new Config();
var adminPasswordHash = Environment.GetEnvironmentVariable("ADMIN_PASSWORD_HASH") ?? throw new KeyNotFoundException("ADMIN_PASSWORD_HASH environment variable is not set.");
config.AdminPasswordHash = adminPasswordHash;

var lastPasswordChanged = Environment.GetEnvironmentVariable("ADMIN_PASSWORD_GENERATED") ?? throw new KeyNotFoundException("ADMIN_PASSWORD_GENERATED environment variable is not set.");
config.LastPasswordChanged = DateTime.Parse(lastPasswordChanged, CultureInfo.InvariantCulture);

builder.Services.AddSingleton(config);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<JsInvokeService>();
builder.Services.AddScoped<GlobalNotificationService>();
builder.Services.AddScoped<GlobalLoadingService>();
builder.Services.AddScoped<NavigationService>();
builder.Services.AddScoped<AuthenticationStateProvider, RevalidatingAuthenticationStateProvider>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuthLoggingService>();
builder.Services.AddScoped<ConfirmModalService>();
builder.Services.AddSingleton(new VersionedContentService(Directory.GetCurrentDirectory() + "/wwwroot"));

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = IdentityConstants.ApplicationScheme;
        options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
    })
    .AddIdentityCookies();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/user/login";
});

builder.Services.AddAliasVaultSqliteConfiguration();
builder.Services.AddDatabaseDeveloperPageExceptionFilter();
builder.Services.AddIdentityCore<AdminUser>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequiredLength = 8;
        options.Password.RequiredUniqueChars = 0;
        options.SignIn.RequireConfirmedAccount = false;
        options.User.RequireUniqueEmail = false;
        options.Lockout.MaxFailedAccessAttempts = 10;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
    })
    .AddRoles<AdminRole>()
    .AddEntityFrameworkStores<AliasServerDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

builder.Services.AddAliasVaultDataProtection("AliasVault.Admin");
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromDays(30);
    options.Name = "AliasVault.Admin";
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

// If the ASPNETCORE_PATHBASE environment variable is set, use it as the path base for the application.
// This is required for running the admin interface behind a reverse proxy on the same port as the client app.
// E.g. default Docker Compose setup makes admin app available on /admin path.
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_PATHBASE")))
{
    app.UsePathBase(Environment.GetEnvironmentVariable("ASPNETCORE_PATHBASE"));
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto,
});

app.UseStaticFiles();
app.UseRouting();
app.UseAntiforgery();
app.UseAuthentication();
app.UseAuthorization();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

using (var scope = app.Services.CreateScope())
{
    var container = scope.ServiceProvider;
    await using var db = await container.GetRequiredService<IDbContextFactory<AliasServerDbContext>>().CreateDbContextAsync();
    await db.Database.MigrateAsync();

    await StartupTasks.CreateRolesIfNotExist(scope.ServiceProvider);
    await StartupTasks.SetAdminUser(scope.ServiceProvider);
}

await app.RunAsync();

namespace AliasVault.Admin
{
    /// <summary>
    /// Explicit program class definition. This is required in order to start the Admin project
    /// in-memory from E2ETests project via WebApplicationFactory.
    /// </summary>
    public partial class Program
    {
    }
}
