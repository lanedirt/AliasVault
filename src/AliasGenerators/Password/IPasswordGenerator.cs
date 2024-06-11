//-----------------------------------------------------------------------
// <copyright file="IPasswordGenerator.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasGenerators.Implementations;

/// <summary>
/// Interface for password generators.
/// </summary>
public interface IPasswordGenerator
{
    /// <summary>
    /// Generates a random password.
    /// </summary>
    /// <returns>Random generated password as string.</returns>
    string GenerateRandomPassword();
}
