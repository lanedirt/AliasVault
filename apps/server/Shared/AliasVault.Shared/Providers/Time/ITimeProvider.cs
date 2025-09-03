// -----------------------------------------------------------------------
// <copyright file="ITimeProvider.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.Shared.Providers.Time;

/// <summary>
/// Time provider interface for getting the current time. We use this to be able to mock the time in tests.
/// </summary>
public interface ITimeProvider
{
    /// <summary>
    /// Gets current time in UTC.
    /// </summary>
    DateTime UtcNow { get; }
}
