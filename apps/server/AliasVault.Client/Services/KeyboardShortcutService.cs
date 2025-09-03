//-----------------------------------------------------------------------
// <copyright file="KeyboardShortcutService.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

/// <summary>
/// Service to manage and act on keyboard shortcuts across the application.
/// </summary>
public sealed class KeyboardShortcutService : IAsyncDisposable
{
    private readonly DotNetObjectReference<CallbackWrapper> _dotNetHelper;
    private readonly NavigationManager _navigationManager;
    private readonly DbService _dbService;
    private readonly AuthService _authService;
    private readonly Lazy<Task<IJSObjectReference>> _moduleTask;

    /// <summary>
    /// Initializes a new instance of the <see cref="KeyboardShortcutService"/> class.
    /// </summary>
    /// <param name="jsRuntime">IJSRuntime instance.</param>
    /// <param name="navigationManager">NavigationManager instance.</param>
    /// <param name="dbService">DbService instance.</param>
    /// <param name="authService">AuthService instance.</param>
    public KeyboardShortcutService(IJSRuntime jsRuntime, NavigationManager navigationManager, DbService dbService, AuthService authService)
    {
        _dotNetHelper = DotNetObjectReference.Create(new CallbackWrapper());
        _navigationManager = navigationManager;
        _dbService = dbService;
        _authService = authService;

        _moduleTask = new Lazy<Task<IJSObjectReference>>(() => jsRuntime.InvokeAsync<IJSObjectReference>(
            "import", "./js/modules/keyboardShortcuts.js").AsTask());

        _ = RegisterStaticShortcuts();
    }

    /// <summary>
    /// Registers a keyboard shortcut with the given keys and callback.
    /// </summary>
    /// <param name="keys">The keyboard keys.</param>
    /// <param name="callback">Callback when shortcut is pressed.</param>
    /// <returns>Task.</returns>
    public async Task RegisterShortcutAsync(string keys, Func<Task> callback)
    {
        _dotNetHelper.Value.RegisterCallback(keys, callback);
        var module = await _moduleTask.Value;
        await module.InvokeVoidAsync("registerShortcut", keys, _dotNetHelper);
    }

    /// <summary>
    /// Unregisters a keyboard shortcut with the given keys.
    /// </summary>
    /// <param name="keys">The keyboard keys.</param>
    /// <returns>Task.</returns>
    public async Task UnregisterShortcutAsync(string keys)
    {
        _dotNetHelper.Value.UnregisterCallback(keys);
        var module = await _moduleTask.Value;
        await module.InvokeVoidAsync("unregisterShortcut", keys);
    }

    /// <summary>
    /// Disposes the service.
    /// </summary>
    /// <returns>ValueTask.</returns>
    public async ValueTask DisposeAsync()
    {
        var module = await _moduleTask.Value;
        await module.InvokeVoidAsync("unregisterAllShortcuts");
        await module.DisposeAsync();

        _dotNetHelper.Dispose();
    }

    /// <summary>
    /// Registers static shortcuts that are always available.
    /// </summary>
    private async Task RegisterStaticShortcuts()
    {
        // Global shortcut: Go home
        await RegisterShortcutAsync("gh", () =>
        {
            _navigationManager.NavigateTo("/");
            return Task.CompletedTask;
        });

        // Global shortcut: Go to email page
        await RegisterShortcutAsync("ge", () =>
        {
            _navigationManager.NavigateTo("/emails");
            return Task.CompletedTask;
        });

        // Global shortcut: Lock vault.
        await RegisterShortcutAsync("gl", () =>
        {
            // Remove encryption key.
            _authService.RemoveEncryptionKey();

            // Initialize empty database which removes unencrypted data.
            _dbService.InitializeEmptyDatabase();

            // Redirect to unlock page.
            _navigationManager.NavigateTo("/unlock");
            return Task.CompletedTask;
        });
    }

    /// <summary>
    /// Wrapper class for callback functions that are invoked from JavaScript.
    /// </summary>
    private sealed class CallbackWrapper
    {
        private readonly Dictionary<string, Func<Task>> _callbacks = new Dictionary<string, Func<Task>>();

        public void RegisterCallback(string keys, Func<Task> callback)
        {
            _callbacks[keys] = callback;
        }

        public void UnregisterCallback(string keys)
        {
            _callbacks.Remove(keys);
        }

        [JSInvokable]
        public async Task Invoke(string keys)
        {
            if (_callbacks.TryGetValue(keys, out var callback))
            {
                await callback();
            }
        }
    }
}
