//-----------------------------------------------------------------------
// <copyright file="PasswordSettings.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Main.Models;

/// <summary>
/// Settings for password generation.
/// </summary>
public class PasswordSettings
{
    /// <summary>
    /// Gets or sets the length of the password.
    /// </summary>
    public int Length { get; set; } = 18;

    /// <summary>
    /// Gets or sets a value indicating whether to use lowercase letters.
    /// </summary>
    public bool UseLowercase { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use uppercase letters.
    /// </summary>
    public bool UseUppercase { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use numbers.
    /// </summary>
    public bool UseNumbers { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use special characters.
    /// </summary>
    public bool UseSpecialChars { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use non-ambiguous characters.
    /// </summary>
    public bool UseNonAmbiguousChars { get; set; } = false;
}
