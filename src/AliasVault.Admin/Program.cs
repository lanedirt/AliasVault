//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Data.Common;
using System.Globalization;
using System.Reflection;
using AliasServerDb;
using AliasVault.Admin;
using AliasVault.Admin.Auth.Providers;
using AliasVault.Admin.Main;
using AliasVault.Admin.Services;
using AliasVault.Logging;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Data.Sqlite;
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
config.LastPasswordChanged = DateTime.ParseExact(lastPasswordChanged, "yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);

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

// We use dbContextFactory to create a new instance of the DbContext for every place that needs it
// as otherwise concurrency issues may occur if we use a single instance of the DbContext across the application.
builder.Services.AddSingleton<DbConnection>(container =>
{
    var connection = new SqliteConnection(builder.Configuration.GetConnectionString("AliasServerDbContext"));
    connection.Open();

    return connection;
});

builder.Services.AddDbContextFactory<AliasServerDbContext>((container, options) =>
{
    var connection = container.GetRequiredService<DbConnection>();
    options.UseSqlite(connection).UseLazyLoadingProxies();
});

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
    })
    .AddRoles<AdminRole>()
    .AddEntityFrameworkStores<AliasServerDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseHttpsRedirection();
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

using (var scope = app.Services.CreateScope())
{
    var container = scope.ServiceProvider;
    var db = await container.GetRequiredService<IDbContextFactory<AliasServerDbContext>>().CreateDbContextAsync();
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
