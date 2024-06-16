//-----------------------------------------------------------------------
// <copyright file="RegisterModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models;

/// <summary>
/// Register model.
/// </summary>
public class RegisterModel
{
    /// <summary>
    /// Gets or sets the email.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    public string Password { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password confirmation.
    /// </summary>
    public string PasswordConfirm { get; set; } = null!;

    /// <summary>
    /// Gets or sets a value indicating whether the terms and conditions are accepted or not.
    /// </summary>
    public bool AcceptTerms { get; set; } = false;
}
