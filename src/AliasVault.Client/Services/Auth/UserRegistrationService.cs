//-----------------------------------------------------------------------
// <copyright file="UserRegistrationService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services.Auth;

using System.Net.Http.Json;
using System.Text.Json;
using AliasVault.Client.Utilities;
using AliasVault.Cryptography.Client;
using AliasVault.Shared.Models.WebApi.Auth;
using Microsoft.AspNetCore.Components.Authorization;
using SecureRemotePassword;

/// <summary>
/// Service responsible for handling user registration operations.
/// </summary>
/// <param name="httpClient">The HTTP client used for making registration requests.</param>
/// <param name="authStateProvider">The provider that manages authentication state.</param>
/// <param name="authService">The service handling authentication operations.</param>
/// <param name="config">The application configuration.</param>
public class UserRegistrationService(HttpClient httpClient, AuthenticationStateProvider authStateProvider, AuthService authService, Config config)
{
    /// <summary>
    /// Registers a new user asynchronously.
    /// </summary>
    /// <param name="username">The username.</param>
    /// <param name="password">The password.</param>
    /// <returns>A tuple indicating the success status and any error message.</returns>
    public async Task<(bool Success, string? ErrorMessage)> RegisterUserAsync(string username, string password)
    {
        try
        {
            var client = new SrpClient();
            var salt = client.GenerateSalt();

            string encryptionType = Defaults.EncryptionType;
            string encryptionSettings = Defaults.EncryptionSettings;
            if (config.CryptographyOverrideType is not null && config.CryptographyOverrideSettings is not null)
            {
                encryptionType = config.CryptographyOverrideType;
                encryptionSettings = config.CryptographyOverrideSettings;
            }

            var passwordHash = await Encryption.DeriveKeyFromPasswordAsync(password, salt, encryptionType, encryptionSettings);
            var passwordHashString = BitConverter.ToString(passwordHash).Replace("-", string.Empty);
            var srpSignup = Srp.PasswordChangeAsync(client, salt, username, passwordHashString);

            var registerRequest = new RegisterRequest(srpSignup.Username, srpSignup.Salt, srpSignup.Verifier, encryptionType, encryptionSettings);
            var result = await httpClient.PostAsJsonAsync("v1/Auth/register", registerRequest);
            var responseContent = await result.Content.ReadAsStringAsync();

            if (!result.IsSuccessStatusCode)
            {
                var errors = ApiResponseUtility.ParseErrorResponse(responseContent);
                return (false, string.Join(", ", errors));
            }

            var tokenObject = JsonSerializer.Deserialize<TokenModel>(responseContent);

            if (tokenObject == null)
            {
                return (false, "An error occurred during registration.");
            }

            await authService.StoreEncryptionKeyAsync(passwordHash);
            await authService.StoreAccessTokenAsync(tokenObject.Token);
            await authService.StoreRefreshTokenAsync(tokenObject.RefreshToken);
            await authStateProvider.GetAuthenticationStateAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, $"An error occurred: {ex.Message}");
        }
    }
}
