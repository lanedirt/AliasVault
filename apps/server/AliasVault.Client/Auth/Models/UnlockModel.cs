//-----------------------------------------------------------------------
// <copyright file="UnlockModel.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Auth.Models;

using System.ComponentModel.DataAnnotations;
using AliasVault.Client.Resources;

/// <summary>
/// Unlock model with localized validation.
/// </summary>
public class UnlockModel
{
    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordRequired))]
    public string Password { get; set; } = null!;
}
