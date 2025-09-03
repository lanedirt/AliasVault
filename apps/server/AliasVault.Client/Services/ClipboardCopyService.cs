//-----------------------------------------------------------------------
// <copyright file="ClipboardCopyService.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System.Timers;
using Timer = System.Timers.Timer;

/// <summary>
/// Service to manage the clipboard copy UI state across the application.
/// </summary>
/// <param name="dbService">Database service to access settings.</param>
public sealed class ClipboardCopyService(DbService dbService) : IDisposable
{
    private string _currentCopiedId = string.Empty;
    private Timer? _progressTimer;
    private Timer? _copiedStateTimer;
    private DateTime _clearTime;

    /// <summary>
    /// Event to notify the application that an item has been copied.
    /// </summary>
    public event Action<string>? OnCopy;

    /// <summary>
    /// Event to notify the application about timer progress for UI updates.
    /// </summary>
    public event Action<double>? OnTimerProgress;

    /// <summary>
    /// Gets the duration in seconds before clipboard is cleared from settings.
    /// </summary>
    public int ClearDurationSeconds => Math.Max(dbService.Settings.ClipboardClearSeconds, 0);

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
            // Only start progress timer if clipboard clearing is enabled (duration > 0)
            if (ClearDurationSeconds > 0)
            {
                StartProgressTimer();
            }

            StartCopiedStateTimer();
        }
        else
        {
            StopProgressTimer();
            StopCopiedStateTimer();
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
        StopCopiedStateTimer();
    }

    private void StartProgressTimer()
    {
        StopProgressTimer();

        var durationSeconds = ClearDurationSeconds;
        if (durationSeconds <= 0)
        {
            return; // Don't start timer if clearing is disabled
        }

        _clearTime = DateTime.UtcNow.AddSeconds(durationSeconds);

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
        var durationSeconds = ClearDurationSeconds;

        if (durationSeconds <= 0)
        {
            StopProgressTimer();
            return;
        }

        var progress = remaining / durationSeconds;

        if (progress <= 0)
        {
            // Timer finished, but don't reset if clipboard clear is still pending
            // The JavaScript will handle clearing and status updates
            StopProgressTimer();
        }
        else
        {
            OnTimerProgress?.Invoke(progress);
        }
    }

    private void StartCopiedStateTimer()
    {
        StopCopiedStateTimer();

        // Use settings delay value, or default to 3 seconds if clipboard clearing is disabled (0 seconds)
        var delaySeconds = ClearDurationSeconds > 0 ? ClearDurationSeconds : 3;

        // Timer to clear the "copied" visual state
        _copiedStateTimer = new Timer(delaySeconds * 1000); // Convert to milliseconds
        _copiedStateTimer.Elapsed += OnCopiedStateTimerElapsed;
        _copiedStateTimer.AutoReset = false; // Only run once
        _copiedStateTimer.Start();
    }

    private void StopCopiedStateTimer()
    {
        _copiedStateTimer?.Stop();
        _copiedStateTimer?.Dispose();
        _copiedStateTimer = null;
    }

    private void OnCopiedStateTimerElapsed(object? sender, ElapsedEventArgs e)
    {
        _currentCopiedId = string.Empty;
        OnCopy?.Invoke(_currentCopiedId);
        StopCopiedStateTimer();
    }
}
