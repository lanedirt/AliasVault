//-----------------------------------------------------------------------
// <copyright file="ClipboardCopyService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System.Timers;
using Timer = System.Timers.Timer;

/// <summary>
/// Service to manage the clipboard copy UI state across the application.
/// </summary>
public sealed class ClipboardCopyService : IDisposable
{
    private string _currentCopiedId = string.Empty;
    private Timer? _progressTimer;
    private DateTime _clearTime;
    private int _clearDurationSeconds = 5;

    /// <summary>
    /// Event to notify the application that an item has been copied.
    /// </summary>
    public event Action<string>? OnCopy;

    /// <summary>
    /// Event to notify the application about timer progress for UI updates.
    /// </summary>
    public event Action<double>? OnTimerProgress;

    /// <summary>
    /// Gets or sets the duration in seconds before clipboard is cleared.
    /// </summary>
    public int ClearDurationSeconds
    {
        get => _clearDurationSeconds;
        set => _clearDurationSeconds = value > 0 ? value : 5;
    }

    /// <summary>
    /// Gets a value indicating whether there is an active progress timer.
    /// </summary>
    public bool IsTimerActive => _progressTimer?.Enabled ?? false;

    /// <summary>
    /// Keep track of the last copied item and start progress timer for UI.
    /// </summary>
    /// <param name="id">Id of the last copied item.</param>
    public void SetCopied(string id)
    {
        _currentCopiedId = id;
        OnCopy?.Invoke(_currentCopiedId);

        if (!string.IsNullOrEmpty(id))
        {
            StartProgressTimer();
        }
        else
        {
            StopProgressTimer();
        }
    }

    /// <summary>
    /// Get the last copied item.
    /// </summary>
    /// <returns>Id of last copied item.</returns>
    public string GetCopiedId() => _currentCopiedId;

    /// <summary>
    /// Gets the remaining time in seconds for UI display.
    /// </summary>
    /// <returns>The remaining seconds until clipboard is cleared.</returns>
    public double GetRemainingSeconds()
    {
        if (!IsTimerActive)
        {
            return 0;
        }

        var remaining = (_clearTime - DateTime.UtcNow).TotalSeconds;
        return Math.Max(0, remaining);
    }

    /// <inheritdoc />
    public void Dispose()
    {
        StopProgressTimer();
    }

    private void StartProgressTimer()
    {
        StopProgressTimer();

        _clearTime = DateTime.UtcNow.AddSeconds(_clearDurationSeconds);

        // Progress timer for UI updates only (every 100ms)
        _progressTimer = new Timer(100);
        _progressTimer.Elapsed += UpdateProgress;
        _progressTimer.AutoReset = true;
        _progressTimer.Start();

        // Initial progress update
        UpdateProgress(null, null);
    }

    private void StopProgressTimer()
    {
        _progressTimer?.Stop();
        _progressTimer?.Dispose();
        _progressTimer = null;

        OnTimerProgress?.Invoke(0);
    }

    private void UpdateProgress(object? sender, ElapsedEventArgs? e)
    {
        var remaining = GetRemainingSeconds();
        var progress = remaining / _clearDurationSeconds;

        if (progress <= 0)
        {
            // Timer finished, reset UI state
            StopProgressTimer();
            _currentCopiedId = string.Empty;
            OnCopy?.Invoke(_currentCopiedId);
        }
        else
        {
            OnTimerProgress?.Invoke(progress);
        }
    }
}
