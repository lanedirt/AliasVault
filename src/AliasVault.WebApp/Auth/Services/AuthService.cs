
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Components.Authorization;

namespace AliasVault.WebApp.Auth.Services;

using AliasVault.Shared.Models;
using Blazored.LocalStorage;
using System.Net.Http.Json;
using System.Text.Json;

public class AuthService
{
    private readonly HttpClient _httpClient;
    private readonly ILocalStorageService _localStorage;
    private const string AccessTokenKey = "token";
    private const string RefreshTokenKey = "refreshToken";

    public AuthService(HttpClient httpClient, ILocalStorageService localStorage)
    {
        _httpClient = httpClient;
        _localStorage = localStorage;
    }

    public async Task<string?> RefreshTokenAsync()
    {
        // Your logic to get the refresh token and request a new access token
        var accessToken = await GetAccessTokenAsync();
        var refreshToken = await GetRefreshTokenAsync();
        var tokenInput = new TokenModel { Token = accessToken, RefreshToken = refreshToken };
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/Auth/refresh")
        {
            Content = JsonContent.Create(tokenInput)
        };
        // Add the X-Ignore-Failure header to the request so any failure does not trigger another refresh token request.
        request.Headers.Add("X-Ignore-Failure", "true");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<TokenModel>(responseContent);

            if (tokenResponse != null)
            {
                // Store the token as a plain string in local storage.
                await StoreAccessTokenAsync(tokenResponse.Token);
                await StoreRefreshTokenAsync(tokenResponse.RefreshToken);

                return tokenResponse.Token;
            }
        }

        return null;
    }

    /// <summary>
    /// Retrieve the stored refresh token (e.g., from local storage or a secure place).
    /// </summary>
    /// <returns></returns>
    public async Task<string> GetAccessTokenAsync()
    {
        return await _localStorage.GetItemAsStringAsync(AccessTokenKey);
    }

    /// <summary>
    /// Store the new access token (e.g., in local storage)
    /// </summary>
    /// <param name="newToken"></param>
    public async Task StoreAccessTokenAsync(string newToken)
    {
        await _localStorage.SetItemAsStringAsync(AccessTokenKey, newToken);
    }

    /// <summary>
    /// Retrieve the stored refresh token (e.g., from local storage or a secure place).
    /// </summary>
    /// <returns></returns>
    public async Task<string> GetRefreshTokenAsync()
    {
        return await _localStorage.GetItemAsStringAsync(RefreshTokenKey);
    }

    /// <summary>
    /// Store the new access token (e.g., in local storage).
    /// </summary>
    /// <param name="newToken"></param>
    public async Task StoreRefreshTokenAsync(string newToken)
    {
        await _localStorage.SetItemAsStringAsync(RefreshTokenKey, newToken);
    }

    /// <summary>
    /// Remove the stored access and refresh tokens, called when logging out.
    /// </summary>
    public async Task RemoveTokensAsync()
    {
        await _localStorage.RemoveItemAsync(AccessTokenKey);
        await _localStorage.RemoveItemAsync(RefreshTokenKey);

        // If the remote call fails we catch the exception and ignore it.
        // This is because the user is already logged out and we don't want to trigger another refresh token request.
        try
        {
            await RevokeTokenAsync();
        }
        catch (Exception)
        {
            // Ignore the exception
        }
    }

    /// <summary>
    /// Revoke the access and refresh tokens on the server.
    /// </summary>
    private async Task RevokeTokenAsync()
    {
        var tokenInput = new TokenModel { Token = await GetAccessTokenAsync(), RefreshToken = await GetRefreshTokenAsync() };
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/Auth/revoke")
        {
            Content = JsonContent.Create(tokenInput)
        };
        // Add the X-Ignore-Failure header to the request so any failure does not trigger another refresh token request.
        request.Headers.Add("X-Ignore-Failure", "true");
        await _httpClient.SendAsync(request);
    }
}
