//-----------------------------------------------------------------------
// <copyright file="LoginModel2Fa.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Login model for two factor authentication step using an authenticator code.
/// </summary>
public class LoginModel2Fa
{
    /// <summary>
    /// Gets or sets the two factor code.
    /// </summary>
    [Required]
    public string TwoFactorCode { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether the current machine should not be asked for 2FA the next time.
    /// </summary>
    public bool RememberMachine { get; set; }
}
