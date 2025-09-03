//-----------------------------------------------------------------------
// <copyright file="AuthStateProvider.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Providers;

using System.Security.Claims;
using System.Text.Json;
using AliasVault.Client.Services.Auth;
using Microsoft.AspNetCore.Components.Authorization;

/// <summary>
/// Custom authentication state provider for the application.
/// </summary>
public class AuthStateProvider(AuthService authService, ILogger<AuthStateProvider> logger) : AuthenticationStateProvider
{
    /// <summary>
    /// Parses the claims from the JWT token.
    /// </summary>
    /// <param name="jwt">The JWT token.</param>
    /// <returns>The claims parsed from the JWT token.</returns>
    public static IEnumerable<Claim> ParseClaimsFromJwt(string jwt)
    {
        var payload = jwt.Split('.')[1];
        var jsonBytes = ParseBase64WithoutPadding(payload);
        var keyValuePairs = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonBytes);

        if (keyValuePairs is null)
        {
            throw new InvalidOperationException("Failed to parse JWT token.");
        }

        return keyValuePairs.Select(kvp => new Claim(kvp.Key, kvp.Value.ToString() ?? string.Empty));
    }

    /// <summary>
    /// Gets the authentication state asynchronously.
    /// </summary>
    /// <returns>The authentication state.</returns>
    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        string token = await authService.GetAccessTokenAsync();

        var identity = new ClaimsIdentity();

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                identity = new ClaimsIdentity(ParseClaimsFromJwt(token), "jwt");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Invalid JWT token. Removing...");
                await authService.RemoveTokensAsync();
                identity = new ClaimsIdentity();
            }
        }

        var user = new ClaimsPrincipal(identity);
        var state = new AuthenticationState(user);

        NotifyAuthenticationStateChanged(Task.FromResult(state));

        return state;
    }

    /// <summary>
    /// Parses the base64 string without padding.
    /// </summary>
    /// <param name="base64">The base64 string.</param>
    /// <returns>The byte array parsed from the base64 string.</returns>
    private static byte[] ParseBase64WithoutPadding(string base64)
    {
        switch (base64.Length % 4)
        {
            case 2: base64 += "=="; break;
            case 3: base64 += "="; break;
        }

        return Convert.FromBase64String(base64);
    }
}
