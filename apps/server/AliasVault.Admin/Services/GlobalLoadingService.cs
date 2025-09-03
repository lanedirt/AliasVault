//-----------------------------------------------------------------------
// <copyright file="GlobalLoadingService.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Services;

/// <summary>
/// Global loading service that can be used to show or hide a global layout loading spinner.
/// </summary>
public class GlobalLoadingService
{
    private bool _isLoading;

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
    /// Show the global loading spinner.
    /// </summary>
    public void Show() => IsLoading = true;

    /// <summary>
    /// Hide the global loading spinner.
    /// </summary>
    public void Hide() => IsLoading = false;
}
