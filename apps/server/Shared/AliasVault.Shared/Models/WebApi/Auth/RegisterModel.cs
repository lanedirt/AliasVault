//-----------------------------------------------------------------------
// <copyright file="RegisterModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth;

using System.ComponentModel.DataAnnotations;
using AliasVault.Shared.Models.Validation;

/// <summary>
/// Register model.
/// </summary>
public class RegisterModel
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
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
    public string Password { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password confirmation.
    /// </summary>
    [Required]
    [Compare("Password", ErrorMessage = "Passwords do not match.")]
    public string PasswordConfirm { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether the terms and conditions are accepted or not.
    /// </summary>
    [MustBeTrue(ErrorMessage = "You must accept the terms and conditions.")]
    public bool AcceptTerms { get; set; } = false;
}
