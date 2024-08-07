//-----------------------------------------------------------------------
// <copyright file="LoginBase.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Auth.Pages.Base;

using System.Net.Http.Json;
using System.Text.Json;
using AliasVault.Client.Services.Auth;
using AliasVault.Shared.Models.WebApi;
using AliasVault.Shared.Models.WebApi.Auth;
using Blazored.LocalStorage;
using Cryptography;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;

/// <summary>
/// Base authorize page that all pages that are part of the logged in website should inherit from.
/// All pages that inherit from this class will require the user to be logged in and have a confirmed email.
/// Also, a default set of breadcrumbs is added in the parent OnInitialized method.
/// </summary>
public class LoginBase : OwningComponentBase
{
    /// <summary>
    /// Gets or sets the NavigationManager.
    /// </summary>
    [Inject]
    public NavigationManager NavigationManager { get; set; } = null!;

    /// <summary>
    /// Gets or sets the HttpClient.
    /// </summary>
    [Inject]
    public HttpClient Http { get; set; } = null!;

    /// <summary>
    /// Gets or sets the AuthenticationStateProvider.
    /// </summary>
    [Inject]
    public AuthenticationStateProvider AuthStateProvider { get; set; } = null!;

    /// <summary>
    /// Gets or sets the GlobalNotificationService.
    /// </summary>
    [Inject]
    public GlobalNotificationService GlobalNotificationService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the IJSRuntime.
    /// </summary>
    [Inject]
    public IJSRuntime Js { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbService.
    /// </summary>
    [Inject]
    public DbService DbService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the AuthService.
    /// </summary>
    [Inject]
    public AuthService AuthService { get; set; } = null!;

    /// <summary>
    /// Gets or sets the LocalStorage.
    /// </summary>
    [Inject]
    public ILocalStorageService LocalStorage { get; set; } = null!;

    /// <summary>
    /// Parses the response content and displays the server validation errors.
    /// </summary>
    /// <param name="responseContent">Response content.</param>
    /// <returns>List of errors if something went wrong.</returns>
    public static List<string> ParseResponse(string responseContent)
    {
        var returnErrors = new List<string>();

        var errorResponse = System.Text.Json.JsonSerializer.Deserialize<ServerValidationErrorResponse>(responseContent);
        if (errorResponse is not null)
        {
            foreach (var error in errorResponse.Errors)
            {
                returnErrors.AddRange(error.Value);
            }
        }

        return returnErrors;
    }

    /// <summary>
    /// Gets the username from the authentication state asynchronously.
    /// </summary>
    /// <param name="email">Email address.</param>
    /// <param name="password">Password.</param>
    /// <returns>List of errors if something went wrong.</returns>
    protected async Task<List<string>> ProcessLoginAsync(string email, string password)
    {
        // Send request to server with email to get server ephemeral public key.
        var result = await Http.PostAsJsonAsync("api/v1/Auth/login", new LoginRequest(email));
        var responseContent = await result.Content.ReadAsStringAsync();

        if (!result.IsSuccessStatusCode)
        {
            return ParseResponse(responseContent);
        }

        var loginResponse = JsonSerializer.Deserialize<LoginResponse>(responseContent);
        if (loginResponse == null)
        {
            return
            [
                "An error occurred while processing the login request.",
            ];
        }

        // 3. Client derives shared session key.
        byte[] passwordHash = await Encryption.DeriveKeyFromPasswordAsync(password, loginResponse.Salt);
        var passwordHashString = BitConverter.ToString(passwordHash).Replace("-", string.Empty);

        var clientEphemeral = Srp.GenerateEphemeralClient();
        var privateKey = Srp.DerivePrivateKey(loginResponse.Salt, email, passwordHashString);
        var clientSession = Srp.DeriveSessionClient(
            privateKey,
            clientEphemeral.Secret,
            loginResponse.ServerEphemeral,
            loginResponse.Salt,
            email);

        // 4. Client sends proof of session key to server.
        result = await Http.PostAsJsonAsync("api/v1/Auth/validate", new ValidateLoginRequest(email, clientEphemeral.Public, clientSession.Proof));
        responseContent = await result.Content.ReadAsStringAsync();

        if (!result.IsSuccessStatusCode)
        {
            return ParseResponse(responseContent);
        }

        var validateLoginResponse = JsonSerializer.Deserialize<ValidateLoginResponse>(responseContent);
        if (validateLoginResponse == null)
        {
            return
            [
                "An error occurred while processing the login request.",
            ];
        }

        // 5. Client verifies proof.
        Srp.VerifySession(clientEphemeral.Public, clientSession, validateLoginResponse.ServerSessionProof);

        // Store the tokens in local storage.
        await AuthService.StoreAccessTokenAsync(validateLoginResponse.Token.Token);
        await AuthService.StoreRefreshTokenAsync(validateLoginResponse.Token.RefreshToken);

        // Store the encryption key in memory.
        AuthService.StoreEncryptionKey(passwordHash);

        await AuthStateProvider.GetAuthenticationStateAsync();
        GlobalNotificationService.ClearMessages();

        // Redirect to the page the user was trying to access before if set.
        var localStorageReturnUrl = await LocalStorage.GetItemAsync<string>("returnUrl");
        if (!string.IsNullOrEmpty(localStorageReturnUrl))
        {
            NavigationManager.NavigateTo(localStorageReturnUrl);
        }
        else
        {
            NavigationManager.NavigateTo("/");
        }

        return [];
    }
}
