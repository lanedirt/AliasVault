//-----------------------------------------------------------------------
// <copyright file="MinDurationLoadingService.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Main.Services;

using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

/// <summary>
/// Service to manage loading states with a minimum duration.
/// </summary>
public class MinDurationLoadingService : IDisposable
{
    private readonly ConcurrentDictionary<string, (DateTime StartTime, int MinDurationMs, bool IsLoading)> _loadingStates = [];

    /// <summary>
    /// Call this to start the loading state for a given key.
    /// </summary>
    /// <param name="key">The key to set the loading state for.</param>
    /// <param name="minDurationMs">The minimum duration in milliseconds that must pass before the loading state can be considered finished.</param>
    /// <param name="onStateChanged">An optional callback to invoke when the state changes.</param>
    public void StartLoading(string key, int minDurationMs, Action? onStateChanged = null)
    {
        _loadingStates[key] = (DateTime.UtcNow, minDurationMs, true);
        onStateChanged?.Invoke();
    }

    /// <summary>
    /// Call this to finish the loading state for a given key, ensuring a minimum duration is respected.
    /// </summary>
    /// <param name="key">The key to clear the loading state for.</param>
    /// <param name="onStateChanged">An optional callback to invoke when the state changes.</param>
    public void FinishLoading(string key, Action? onStateChanged = null)
    {
        if (!_loadingStates.TryGetValue(key, out var state) || !state.IsLoading)
        {
            // Nothing to do
            return;
        }

        var elapsed = (DateTime.UtcNow - state.StartTime).TotalMilliseconds;
        var remaining = Math.Max(0, state.MinDurationMs - elapsed);

        Task.Run(async () =>
        {
            if (remaining > 0)
            {
                await Task.Delay((int)remaining);
            }

            if (_loadingStates.TryGetValue(key, out var currentState) && currentState.IsLoading)
            {
                _loadingStates[key] = (currentState.StartTime, currentState.MinDurationMs, false);
                onStateChanged?.Invoke();
            }
        });
    }

    /// <summary>
    /// Checks if a given key is currently in a loading state.
    /// </summary>
    /// <param name="key">The key to check the loading state for.</param>
    /// <returns>True if the key is loading, false otherwise.</returns>
    public bool IsLoading(string key)
    {
        return _loadingStates.TryGetValue(key, out var state) && state.IsLoading;
    }

    /// <summary>
    /// Disposes of the service.
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Protected implementation of Dispose pattern.
    /// </summary>
    /// <param name="disposing">True if called from Dispose, false if called from finalizer.</param>
    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
        {
            _loadingStates.Clear();
        }
    }
}
