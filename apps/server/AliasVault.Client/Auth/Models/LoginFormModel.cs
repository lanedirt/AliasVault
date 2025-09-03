//-----------------------------------------------------------------------
// <copyright file="LoginFormModel.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Auth.Models;

using System.ComponentModel.DataAnnotations;
using AliasVault.Client.Resources;

/// <summary>
/// Login form model with localized validation.
/// </summary>
public class LoginFormModel
{
    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.UsernameRequired))]
    public string Username { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordRequired))]
    public string Password { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether the user wants to be remembered.
    /// </summary>
    public bool RememberMe { get; set; } = true;
}
