//-----------------------------------------------------------------------
// <copyright file="GlobalLoadingService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

/// <summary>
/// Global loading service that can be used to show or hide a global layout loading spinner.
/// </summary>
public sealed class GlobalLoadingService
{
    private bool _isLoading;
    private string _loadingMessage = string.Empty;

    /// <summary>
    /// Occurs when the loading state changes.
    /// </summary>
    public event Action? OnChange;

    /// <summary>
    /// Gets or sets a value indicating whether the global loading spinner is currently visible.
    /// </summary>
    public bool IsLoading
    {
        get => _isLoading;
        set
        {
            if (_isLoading != value)
            {
                _isLoading = value;
                OnChange?.Invoke();
            }
        }
    }

    /// <summary>
    /// Gets the current loading message.
    /// </summary>
    public string LoadingMessage
    {
        get => _loadingMessage;
        private set
        {
            if (_loadingMessage != value)
            {
                _loadingMessage = value;
                OnChange?.Invoke();
            }
        }
    }

    /// <summary>
    /// Show the global loading spinner.
    /// </summary>
    /// <param name="message">Optional message to display below the loading spinner.</param>
    public void Show(string? message = null)
    {
        LoadingMessage = message ?? string.Empty;
        IsLoading = true;
    }

    /// <summary>
    /// Hide the global loading spinner.
    /// </summary>
    public void Hide()
    {
        IsLoading = false;
        LoadingMessage = string.Empty;
    }
}
