using Microsoft.AspNetCore.Components;

namespace AliasVault.WebApp.Auth.Services;

using System.Net;
using System.Net.Http.Headers;

public class AliasVaultApiHandlerService : DelegatingHandler
{
    private readonly IServiceProvider _serviceProvider;

    public AliasVaultApiHandlerService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // Check if the request already contains the refreshed token to prevent infinite loop
        if (request.Headers.Contains("X-Ignore-Failure"))
        {
            // Remove the header to avoid sending it with the final request
            request.Headers.Remove("X-Ignore-Failure");
            return await base.SendAsync(request, cancellationToken);
        }

        // Set the access token in the Authorization header
        var authService = _serviceProvider.GetRequiredService<AuthService>();
        var token = await authService.GetAccessTokenAsync();
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await base.SendAsync(request, cancellationToken);
        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            // Call the refresh token endpoint to get a new access token
            var newToken = await authService.RefreshTokenAsync();

            if (!string.IsNullOrEmpty(newToken))
            {
                // Retry the original request with the new access token
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", newToken);
                // Add a custom header to indicate that this is a retry attempt
                request.Headers.Add("X-Ignore-Failure", "true");
                response = await base.SendAsync(request, cancellationToken);
                return response;
            }
            else
            {
                // Redirect to the login page.
                var navigationManager = _serviceProvider.GetRequiredService<NavigationManager>();
                navigationManager.NavigateTo("/user/login");

            }
        }

        return response;
    }
}
