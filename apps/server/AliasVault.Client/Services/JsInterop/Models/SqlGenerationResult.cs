//-----------------------------------------------------------------------
// <copyright file="SqlGenerationResult.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services.JsInterop.Models;

/// <summary>
/// Represents the result of SQL generation for vault operations.
/// </summary>
public sealed class SqlGenerationResult
{
    /// <summary>
    /// Gets a value indicating whether the SQL generation was successful.
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// Gets the generated SQL commands to execute.
    /// </summary>
    public List<string> SqlCommands { get; init; } = [];

    /// <summary>
    /// Gets the vault version.
    /// </summary>
    public string Version { get; init; } = "0.0.0";

    /// <summary>
    /// Gets the migration number.
    /// </summary>
    public int MigrationNumber { get; init; }

    /// <summary>
    /// Gets the optional error message.
    /// </summary>
    public string? Error { get; init; }
}
