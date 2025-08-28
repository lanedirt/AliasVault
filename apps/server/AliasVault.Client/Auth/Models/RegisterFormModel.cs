//-----------------------------------------------------------------------
// <copyright file="RegisterFormModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Auth.Models;

using System.ComponentModel.DataAnnotations;
using AliasVault.Client.Resources;
using AliasVault.Shared.Models.Validation;
using AliasVault.Shared.Models.WebApi.Auth;

/// <summary>
/// Register form model with validation.
/// </summary>
public class RegisterFormModel : RegisterModel
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
    [MinLength(8, ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordMinLengthGeneric))]
    public new string Password { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password confirmation.
    /// </summary>
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordRequired))]
    [Compare("Password", ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordsDoNotMatchGeneric))]
    public new string PasswordConfirm { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether the terms and conditions are accepted or not.
    /// </summary>
    [MustBeTrue(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.MustAcceptTerms))]
    public new bool AcceptTerms { get; set; } = false;

    /// <summary>
    /// Converts the form model to the base model.
    /// </summary>
    /// <returns>The base RegisterModel.</returns>
    public RegisterModel ToBaseModel()
    {
        return new RegisterModel
        {
            Username = Username,
            Password = Password,
            PasswordConfirm = PasswordConfirm,
            AcceptTerms = AcceptTerms,
        };
    }
}
