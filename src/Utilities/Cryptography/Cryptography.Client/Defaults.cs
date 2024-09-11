//-----------------------------------------------------------------------
// <copyright file="Defaults.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography.Client;

/// <summary>
/// Cryptography defaults.
/// </summary>
public static class Defaults
{
    /// <summary>
    /// Gets the default encryption type.
    /// </summary>
    public static string EncryptionType { get; } = "Argon2Id";

    /// <summary>
    /// Gets the default degree of parallelism for Argon2id.
    /// </summary>
    public static int Argon2IdDegreeOfParallelism { get; } = 1;

    /// <summary>
    /// Gets the default memory size for Argon2id (in KB).
    /// </summary>
    public static int Argon2IdMemorySize { get; } = 32768;

    /// <summary>
    /// Gets the default number of iterations for Argon2id.
    /// </summary>
    public static int Argon2IdIterations { get; } = 2;

    /// <summary>
    /// Gets the default encryption settings.
    /// </summary>
    public static string EncryptionSettings { get; } = $"{{\"DegreeOfParallelism\":{Argon2IdDegreeOfParallelism},\"MemorySize\":{Argon2IdMemorySize},\"Iterations\":{Argon2IdIterations}}}";
}
