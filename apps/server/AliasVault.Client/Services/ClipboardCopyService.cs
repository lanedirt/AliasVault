//-----------------------------------------------------------------------
// <copyright file="ClipboardCopyService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

/// <summary>
/// Service to manage the clipboard copy operations across the application.
/// </summary>
public sealed class ClipboardCopyService
{
    private string _currentCopiedId = string.Empty;

    /// <summary>
    /// Event to notify the application that an item has been copied.
    /// </summary>
    public event Action<string>? OnCopy;

    /// <summary>
    /// Keep track of the last copied item.
    /// </summary>
    /// <param name="id">Id of the last copied item.</param>
    public void SetCopied(string id)
    {
        _currentCopiedId = id;
        OnCopy?.Invoke(_currentCopiedId);
    }

    /// <summary>
    /// Get the last copied item.
    /// </summary>
    /// <returns>Id of last copied item.</returns>
    public string GetCopiedId() => _currentCopiedId;
}
