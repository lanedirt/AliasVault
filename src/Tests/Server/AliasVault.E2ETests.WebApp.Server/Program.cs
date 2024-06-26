var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseBlazorFrameworkFiles();

app.UseStaticFiles();

app.UseRouting();

app.MapRazorPages();

app.MapFallbackToFile("index.html");

app.Run();

namespace AliasVault.E2ETests.WebApp.Server
{
    /// <summary>
    /// Explicit program class definition. This is required in order to start the WebAPI project
    /// in-memory from E2ETests project via WebApplicationFactory.
    /// </summary>
    public partial class Program
    {
    }
}
