//-----------------------------------------------------------------------
// <copyright file="KeyboardShortcutService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

/// <summary>
/// Service class for alias operations.
/// </summary>
public class KeyboardShortcutService : IAsyncDisposable
{
    private readonly IJSRuntime _jsRuntime;
    private readonly DotNetObjectReference<CallbackWrapper> _dotNetHelper;
    private readonly NavigationManager _navigationManager;

    /// <summary>
    /// Initializes a new instance of the <see cref="KeyboardShortcutService"/> class.
    /// </summary>
    /// <param name="jsRuntime">IJSRuntime instance.</param>
    /// <param name="navigationManager">NavigationManager instance.</param>
    public KeyboardShortcutService(IJSRuntime jsRuntime, NavigationManager navigationManager)
    {
        _jsRuntime = jsRuntime;
        _dotNetHelper = DotNetObjectReference.Create(new CallbackWrapper());
        _navigationManager = navigationManager;

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
        await _jsRuntime.InvokeVoidAsync("keyboardShortcuts.registerShortcut", keys, _dotNetHelper);
    }

    /// <summary>
    /// Unregisters a keyboard shortcut with the given keys.
    /// </summary>
    /// <param name="keys">The keyboard keys.</param>
    /// <returns>Task.</returns>
    public async Task UnregisterShortcutAsync(string keys)
    {
        _dotNetHelper.Value.UnregisterCallback(keys);
        await _jsRuntime.InvokeVoidAsync("keyboardShortcuts.unregisterShortcut", keys);
    }

    /// <summary>
    /// Disposes the service.
    /// </summary>
    /// <returns>ValueTask.</returns>
    public async ValueTask DisposeAsync()
    {
        await _jsRuntime.InvokeVoidAsync("keyboardShortcuts.unregisterAllShortcuts");
        _dotNetHelper.Dispose();
        GC.SuppressFinalize(this);
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
    }

    private class CallbackWrapper
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
