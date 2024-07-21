using System.Data.Common;
using AliasServerDb;
using AliasVault.Admin;
using AliasVault.Admin.Auth;
using AliasVault.Admin.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddDataProtection();
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
    options.TokenLifespan = TimeSpan.FromHours(12));

builder.Services.AddIdentity<AdminUser, AdminRole>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequiredLength = 8;
        options.Password.RequiredUniqueChars = 0;
        options.SignIn.RequireConfirmedAccount = false;
    })
    .AddEntityFrameworkStores<AliasServerDbContext>()
    .AddDefaultTokenProviders();
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Services.AddScoped<JsInvokeService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<PortalMessageService>();
builder.Services.AddScoped<AuthenticationStateProvider, RevalidatingIdentityAuthenticationStateProvider<AdminUser>>();
builder.Services.AddTransient<IClaimsTransformation, ClaimsTransformer>();
builder.Services.AddSingleton(new VersionedContentService(Directory.GetCurrentDirectory() + "/wwwroot"));

// Force all app generated URLs to be lowercase as this improves SEO.
builder.Services.AddRouting(options => options.LowercaseUrls = true);

// Add services to the container.
if (!builder.Environment.IsDevelopment())
{
    // Normal production use
    builder.Services.AddServerSideBlazor();
}
else
{
    // Dev use
    builder.Services.AddServerSideBlazor()
        .AddCircuitOptions(e => {
            e.DetailedErrors = true;
        });
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddRazorPages();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseAntiforgery();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapBlazorHub();

app.MapFallbackToPage("/_Host");

using (var scope = app.Services.CreateScope())
{
    await StartupTasks.CreateRolesIfNotExist(scope.ServiceProvider);
}

app.Run();
