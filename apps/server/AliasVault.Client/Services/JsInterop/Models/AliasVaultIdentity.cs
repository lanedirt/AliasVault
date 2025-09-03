//-----------------------------------------------------------------------
// <copyright file="AliasVaultIdentity.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services.JsInterop.Models;

/// <summary>
/// Represents the result of a JavaScript identity generator operation.
/// </summary>
public sealed class AliasVaultIdentity
{
    /// <summary>
    /// Gets the first name.
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Gets the last name.
    /// </summary>
    public string? LastName { get; init; }

    /// <summary>
    /// Gets the birth date.
    /// </summary>
    public string? BirthDate { get; init; }

    /// <summary>
    /// Gets the email prefix.
    /// </summary>
    public string? EmailPrefix { get; init; }

    /// <summary>
    /// Gets the nickname.
    /// </summary>
    public string? NickName { get; init; }

    /// <summary>
    /// Gets the gender.
    /// </summary>
    public string? Gender { get; init; }
}
