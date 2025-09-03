//-----------------------------------------------------------------------
// <copyright file="PasswordSettings.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Main.Models;

using System.Text.Json.Serialization;

/// <summary>
/// Settings for password generation.
/// </summary>
public class PasswordSettings
{
    /// <summary>
    /// Gets or sets the length of the password.
    /// </summary>
    [JsonPropertyName("Length")]
    public int Length { get; set; } = 18;

    /// <summary>
    /// Gets or sets a value indicating whether to use lowercase letters.
    /// </summary>
    [JsonPropertyName("UseLowercase")]
    public bool UseLowercase { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use uppercase letters.
    /// </summary>
    [JsonPropertyName("UseUppercase")]
    public bool UseUppercase { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use numbers.
    /// </summary>
    [JsonPropertyName("UseNumbers")]
    public bool UseNumbers { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use special characters.
    /// </summary>
    [JsonPropertyName("UseSpecialChars")]
    public bool UseSpecialChars { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use non-ambiguous characters.
    /// </summary>
    [JsonPropertyName("UseNonAmbiguousChars")]
    public bool UseNonAmbiguousChars { get; set; } = false;
}
