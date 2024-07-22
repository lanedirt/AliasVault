using System.Data.Common;
using System.Globalization;
using AliasServerDb;
using AliasVault.Admin;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AliasVault.Admin.Auth.Providers;
using AliasVault.Admin.Main;
using AliasVault.Admin.Services;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

// Create global config object, get values from environment variables.
Config config = new Config();
var adminPasswordHash = Environment.GetEnvironmentVariable("ADMIN_PASSWORD_HASH")
                   ?? throw new KeyNotFoundException("ADMIN_PASSWORD_HASH environment variable is not set.");
config.AdminPasswordHash = adminPasswordHash;

var lastPasswordChanged = Environment.GetEnvironmentVariable("ADMIN_PASSWORD_GENERATED")
                   ?? throw new KeyNotFoundException("ADMIN_PASSWORD_GENERATED environment variable is not set.");
config.LastPasswordChanged = DateTime.ParseExact(lastPasswordChanged, "yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);

builder.Services.AddSingleton(config);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<JsInvokeService>();
builder.Services.AddScoped<GlobalNotificationService>();
builder.Services.AddScoped<NavigationService>();
builder.Services.AddScoped<AuthenticationStateProvider, RevalidatingAuthenticationStateProvider>();

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
    var configFile = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json")
        .Build();

    var connection = new SqliteConnection(configFile.GetConnectionString("AliasServerDbContext"));
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
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

using (var scope = app.Services.CreateScope())
{
    await StartupTasks.CreateRolesIfNotExist(scope.ServiceProvider);
    await StartupTasks.SetAdminUser(scope.ServiceProvider);
}

app.Run();
