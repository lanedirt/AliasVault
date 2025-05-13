//-----------------------------------------------------------------------
// <copyright file="LoginModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Login model.
/// </summary>
public class LoginModel
{
    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    [Required]
    public string Username { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Required]
    public string Password { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether the user wants to be remembered.
    /// </summary>
    public bool RememberMe { get; set; } = true;
}
