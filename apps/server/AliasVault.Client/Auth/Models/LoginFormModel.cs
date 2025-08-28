//-----------------------------------------------------------------------
// <copyright file="LoginFormModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Auth.Models;

using System.ComponentModel.DataAnnotations;
using AliasVault.Client.Resources;
using AliasVault.Shared.Models.WebApi.Auth;

/// <summary>
/// Login form model with localized validation.
/// </summary>
public class LoginFormModel : LoginModel
{
    /// <summary>
    /// Gets or sets the username.
    /// </summary>
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.UsernameRequired))]
    public new string Username { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordRequired))]
    public new string Password { get; set; } = null!;

    /// <summary>
    /// Converts the form model to the base model.
    /// </summary>
    /// <returns>The base LoginModel.</returns>
    public LoginModel ToBaseModel()
    {
        return new LoginModel
        {
            Username = Username,
            Password = Password,
            RememberMe = RememberMe,
        };
    }
}
