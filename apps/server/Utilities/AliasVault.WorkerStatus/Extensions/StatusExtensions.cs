// -----------------------------------------------------------------------
// <copyright file="StatusExtensions.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.WorkerStatus.Extensions;

/// <summary>
/// Extension methods for the Status enum.
/// </summary>
internal static class StatusExtensions
{
    /// <summary>
    /// String to Status enum conversion.
    /// </summary>
    /// <param name="status">Status enum.</param>
    /// <returns>String as status enum.</returns>
    /// <exception cref="ArgumentException">Thrown if string is not a known status enum.</exception>
    public static Status ToStatusEnum(this string status)
    {
        return Enum.TryParse(status, out Status result) ? result : throw new ArgumentException("Invalid status value");
    }
}
