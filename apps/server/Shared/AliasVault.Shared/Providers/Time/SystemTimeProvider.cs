// -----------------------------------------------------------------------
// <copyright file="SystemTimeProvider.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.Shared.Providers.Time;

/// <summary>
/// Default time provider that uses the system clock.
/// </summary>
public class SystemTimeProvider : ITimeProvider
{
    /// <summary>
    /// Gets current time in UTC.
    /// </summary>
    public DateTime UtcNow => DateTime.UtcNow;
}
