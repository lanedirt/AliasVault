// -----------------------------------------------------------------------
// <copyright file="ITimeProvider.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.Shared.Providers;

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
