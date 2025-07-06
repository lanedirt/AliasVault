//-----------------------------------------------------------------------
// <copyright file="LanguageService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System.Globalization;
using AliasVault.Client.Services.Database;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;

/// <summary>
/// Service for managing application language settings and culture switching.
/// </summary>
public class LanguageService(
    ILocalStorageService localStorage,
    IJSRuntime jsRuntime,
    AuthenticationStateProvider authenticationStateProvider,
    DbService dbService)
{
    private readonly ILocalStorageService _localStorage = localStorage;
    private readonly IJSRuntime _jsRuntime = jsRuntime;
    private readonly AuthenticationStateProvider _authenticationStateProvider = authenticationStateProvider;
    private readonly DbService _dbService = dbService;

    /// <summary>
    /// Event that is triggered when the language is changed.
    /// </summary>
    public event Action<string>? LanguageChanged;

    /// <summary>
    /// Gets the list of supported languages.
    /// </summary>
    /// <returns>Dictionary of language codes and display names.</returns>
    public static Dictionary<string, string> GetSupportedLanguages()
    {
        return new Dictionary<string, string>
        {
            ["en"] = "English",
            ["nl"] = "Nederlands",
        };
    }

    /// <summary>
    /// Gets the current language from the browser.
    /// </summary>
    /// <returns>Browser language code.</returns>
    public async Task<string> GetBrowserLanguageAsync()
    {
        try
        {
            var browserLanguage = await _jsRuntime.InvokeAsync<string>("navigator.language");
            var cultureName = browserLanguage.Split('-')[0];

            var supportedLanguages = GetSupportedLanguages();
            return supportedLanguages.ContainsKey(cultureName) ? cultureName : "en";
        }
        catch
        {
            return "en";
        }
    }

    /// <summary>
    /// Gets the current language setting.
    /// </summary>
    /// <returns>Current language code.</returns>
    public async Task<string> GetCurrentLanguageAsync()
    {
        var authState = await _authenticationStateProvider.GetAuthenticationStateAsync();

        if (authState.User.Identity?.IsAuthenticated == true)
        {
            // User is authenticated, get language from vault settings
            try
            {
                var language = await _dbService.Settings.GetSettingAsync<string>("AppLanguage");
                if (!string.IsNullOrEmpty(language))
                {
                    return language;
                }
            }
            catch
            {
                // Ignore errors and fall back to browser language
            }
        }

        // User is not authenticated or no language preference set, check local storage
        try
        {
            var storedLanguage = await _localStorage.GetItemAsync<string>("AppLanguage");
            if (!string.IsNullOrEmpty(storedLanguage))
            {
                return storedLanguage;
            }
        }
        catch
        {
            // Ignore errors and fall back to browser language
        }

        // Fall back to browser language
        return await GetBrowserLanguageAsync();
    }

    /// <summary>
    /// Sets the language and updates the culture.
    /// </summary>
    /// <param name="languageCode">Language code to set.</param>
    /// <returns>Task.</returns>
    public async Task SetLanguageAsync(string languageCode)
    {
        if (string.IsNullOrEmpty(languageCode))
        {
            return;
        }

        var supportedLanguages = GetSupportedLanguages();
        if (!supportedLanguages.ContainsKey(languageCode))
        {
            return;
        }

        var authState = await _authenticationStateProvider.GetAuthenticationStateAsync();

        if (authState.User.Identity?.IsAuthenticated == true)
        {
            // User is authenticated, save to vault settings
            try
            {
                await _dbService.Settings.SetSettingAsync("AppLanguage", languageCode);
            }
            catch
            {
                // Ignore errors, still set the culture
            }
        }
        else
        {
            // User is not authenticated, save to local storage
            try
            {
                await _localStorage.SetItemAsync("AppLanguage", languageCode);
            }
            catch
            {
                // Ignore errors, still set the culture
            }
        }

        // Set the culture dynamically without page reload
        var culture = new CultureInfo(languageCode);
        CultureInfo.CurrentCulture = culture;
        CultureInfo.CurrentUICulture = culture;
        CultureInfo.DefaultThreadCurrentCulture = culture;
        CultureInfo.DefaultThreadCurrentUICulture = culture;

        // Store in blazorCulture for consistency
        await _jsRuntime.InvokeVoidAsync("blazorCulture.set", languageCode);

        // Notify listeners that language has changed
        LanguageChanged?.Invoke(languageCode);
    }

    /// <summary>
    /// Initializes the language service and sets the initial culture.
    /// </summary>
    /// <returns>Task.</returns>
    public async Task InitializeAsync()
    {
        var initialLanguage = "en"; // Default fallback

        try
        {
            // Get the initial language preference from JavaScript
            initialLanguage = await _jsRuntime.InvokeAsync<string>("blazorCulture.get");
        }
        catch
        {
            // Fallback if JavaScript is not available yet
            try
            {
                var browserLang = await _jsRuntime.InvokeAsync<string>("eval", "navigator.language");
                var cultureName = browserLang.Split('-')[0];
                if (cultureName == "nl")
                {
                    initialLanguage = "nl";
                }
            }
            catch
            {
                // Use default "en"
            }
        }

        // Validate the language
        var supportedLanguages = GetSupportedLanguages();
        if (!supportedLanguages.ContainsKey(initialLanguage))
        {
            initialLanguage = "en";
        }

        // Set the culture
        var culture = new CultureInfo(initialLanguage);
        CultureInfo.CurrentCulture = culture;
        CultureInfo.CurrentUICulture = culture;
        CultureInfo.DefaultThreadCurrentCulture = culture;
        CultureInfo.DefaultThreadCurrentUICulture = culture;

        // Store in blazorCulture for consistency (if available)
        try
        {
            await _jsRuntime.InvokeVoidAsync("blazorCulture.set", initialLanguage);
        }
        catch
        {
            // Ignore if blazorCulture is not available yet
        }
    }
}
