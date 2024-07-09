//-----------------------------------------------------------------------
// <copyright file="AuthService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Services.Auth;

using System.Net.Http.Json;
using System.Text.Json;
using AliasVault.Shared.Models;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

/// <summary>
/// This service is responsible for handling authentication-related operations such as refreshing tokens,
/// storing tokens, and revoking tokens.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="AuthService"/> class.
/// </remarks>
/// <param name="httpClient">The HTTP client.</param>
/// <param name="localStorage">The local storage service.</param>
/// <param name="environment">IWebAssemblyHostEnvironment instance.</param>
/// <param name="configuration">IConfiguration instance.</param>
public class AuthService(HttpClient httpClient, ILocalStorageService localStorage, IWebAssemblyHostEnvironment environment, IConfiguration configuration)
{
    private const string AccessTokenKey = "token";
    private const string RefreshTokenKey = "refreshToken";
    private byte[] _encryptionKey = new byte[32];

    /// <summary>
    /// Refreshes the access token asynchronously.
    /// </summary>
    /// <returns>The new access token.</returns>
    public async Task<string?> RefreshTokenAsync()
    {
        // Your logic to get the refresh token and request a new access token
        var accessToken = await GetAccessTokenAsync();
        var refreshToken = await GetRefreshTokenAsync();
        var tokenInput = new TokenModel { Token = accessToken, RefreshToken = refreshToken };
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/v1/Auth/refresh")
        {
            Content = JsonContent.Create(tokenInput),
        };

        // Add the X-Ignore-Failure header to the request so any failure does not trigger another refresh token request.
        request.Headers.Add("X-Ignore-Failure", "true");
        var response = await httpClient.SendAsync(request);

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
    /// Retrieves the stored access token asynchronously.
    /// </summary>
    /// <returns>The stored access token.</returns>
    public async Task<string> GetAccessTokenAsync()
    {
        return await localStorage.GetItemAsStringAsync(AccessTokenKey) ?? string.Empty;
    }

    /// <summary>
    /// Stores the new access token asynchronously.
    /// </summary>
    /// <param name="newToken">The new access token.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task StoreAccessTokenAsync(string newToken)
    {
        await localStorage.SetItemAsStringAsync(AccessTokenKey, newToken);
    }

    /// <summary>
    /// Retrieves the stored refresh token asynchronously.
    /// </summary>
    /// <returns>The stored refresh token.</returns>
    public async Task<string> GetRefreshTokenAsync()
    {
        return await localStorage.GetItemAsStringAsync(RefreshTokenKey) ?? string.Empty;
    }

    /// <summary>
    /// Get encryption key.
    /// </summary>
    /// <returns>Encryption key as byte[].</returns>
    public byte[] GetEncryptionKeyAsync()
    {
        return _encryptionKey;
    }

    /// <summary>
    /// Get encryption key as base64 string.
    /// </summary>
    /// <returns>Encryption key as base64 string.</returns>
    public string GetEncryptionKeyAsBase64Async()
    {
        if (environment.IsDevelopment() && configuration["UseDebugEncryptionKey"] == "true")
        {
            // When project runs in development mode a static encryption key will be used.
            // This allows to skip the unlock screen for faster development.
            // Use launch profile "http-release" to get the actual user flow.
            return "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB=";
        }

        return Convert.ToBase64String(GetEncryptionKeyAsync());
    }

    /// <summary>
    /// Returns whether the encryption key is set.
    /// </summary>
    /// <returns>Return true if encryption key is set, otherwise false.</returns>
    public bool IsEncryptionKeySet()
    {
        // Check that encryption key is set. If not, redirect to unlock screen.
        var encryptionKey = GetEncryptionKeyAsBase64Async();
        if (encryptionKey == string.Empty || encryptionKey == "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        {
            // Encryption key is empty or base64 encoded empty string.
            return false;
        }

        return true;
    }

    /// <summary>
    /// Stores the encryption key asynchronously in-memory.
    /// </summary>
    /// <param name="newKey">Encryption key.</param>
    public void StoreEncryptionKey(byte[] newKey)
    {
        _encryptionKey = newKey;
    }

    /// <summary>
    /// Stores the new refresh token asynchronously.
    /// </summary>
    /// <param name="newToken">The new refresh token.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task StoreRefreshTokenAsync(string newToken)
    {
        await localStorage.SetItemAsStringAsync(RefreshTokenKey, newToken);
    }

    /// <summary>
    /// Removes the stored access and refresh tokens asynchronously, called when logging out.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task RemoveTokensAsync()
    {
        // Revoke the tokens from the server by calling the webapi.
        try
        {
            await RevokeTokenAsync();
        }
        catch (Exception)
        {
            // If an exception occurs we ignore it and continue with removing the tokens from local storage.
        }

        // Remove the tokens from local storage.
        await localStorage.RemoveItemAsync(AccessTokenKey);
        await localStorage.RemoveItemAsync(RefreshTokenKey);
    }

    /// <summary>
    /// Revokes the access and refresh tokens on the server asynchronously.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    private async Task RevokeTokenAsync()
    {
        var tokenInput = new TokenModel
        {
            Token = await GetAccessTokenAsync(),
            RefreshToken = await GetRefreshTokenAsync(),
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "api/v1/Auth/revoke")
        {
            Content = JsonContent.Create(tokenInput),
        };

        // Add the X-Ignore-Failure header to the request so any failure does not trigger another refresh token request.
        request.Headers.Add("X-Ignore-Failure", "true");
        await httpClient.SendAsync(request);
    }
}
