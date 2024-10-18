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
/// This service is responsible for registering a new user.
/// </summary>
public class UserRegistrationService
{
    private readonly HttpClient _httpClient;
    private readonly AuthenticationStateProvider _authStateProvider;
    private readonly AuthService _authService;
    private readonly IConfiguration _configuration;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserRegistrationService"/> class.
    /// </summary>
    /// <param name="httpClient">The HTTP client.</param>
    /// <param name="authStateProvider">The authentication state provider.</param>
    /// <param name="authService">The authentication service.</param>
    /// <param name="configuration">The configuration.</param>
    public UserRegistrationService(
        HttpClient httpClient,
        AuthenticationStateProvider authStateProvider,
        AuthService authService,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _authStateProvider = authStateProvider;
        _authService = authService;
        _configuration = configuration;
    }

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
            if (_configuration["CryptographyOverrideType"] is not null && _configuration["CryptographyOverrideSettings"] is not null)
            {
                encryptionType = _configuration["CryptographyOverrideType"]!;
                encryptionSettings = _configuration["CryptographyOverrideSettings"]!;
            }

            var passwordHash = await Encryption.DeriveKeyFromPasswordAsync(password, salt, encryptionType, encryptionSettings);
            var passwordHashString = BitConverter.ToString(passwordHash).Replace("-", string.Empty);
            var srpSignup = Srp.PasswordChangeAsync(client, salt, username, passwordHashString);

            var registerRequest = new RegisterRequest(srpSignup.Username, srpSignup.Salt, srpSignup.Verifier, encryptionType, encryptionSettings);
            var result = await _httpClient.PostAsJsonAsync("api/v1/Auth/register", registerRequest);
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

            await _authService.StoreEncryptionKeyAsync(passwordHash);
            await _authService.StoreAccessTokenAsync(tokenObject.Token);
            await _authService.StoreRefreshTokenAsync(tokenObject.RefreshToken);
            await _authStateProvider.GetAuthenticationStateAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, $"An error occurred: {ex.Message}");
        }
    }
}
