// -----------------------------------------------------------------------
// <copyright file="TestTimeProvider.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.Shared.Providers.Time;

/// <summary>
/// Test time provider that allows mutating the current time for testing purposes.
/// </summary>
public class TestTimeProvider : ITimeProvider
{
    private DateTime _currentTime = DateTime.UtcNow;

    /// <summary>
    /// Gets current time in UTC.
    /// </summary>
    public DateTime UtcNow => _currentTime;

    /// <summary>
    /// Set the current time to a specific date and time.
    /// </summary>
    /// <param name="dateTime">DateTime to set current time to.</param>
    public void SetUtcNow(DateTime dateTime)
    {
        _currentTime = dateTime;
    }

    /// <summary>
    /// Advance current time by a specific time span.
    /// </summary>
    /// <param name="timeSpan">Amount of time to advance current time by.</param>
    public void AdvanceBy(TimeSpan timeSpan)
    {
        _currentTime = _currentTime.Add(timeSpan);
    }
}
