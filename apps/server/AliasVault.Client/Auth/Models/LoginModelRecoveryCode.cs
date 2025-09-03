//-----------------------------------------------------------------------
// <copyright file="LoginModelRecoveryCode.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Auth.Models;

using System.ComponentModel.DataAnnotations;
using AliasVault.Client.Resources;

/// <summary>
/// Login model for two factor authentication step using a recovery code.
/// </summary>
public class LoginModelRecoveryCode
{
    /// <summary>
    /// Gets or sets the recovery code.
    /// </summary>
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.FieldRequired))]
    public string RecoveryCode { get; set; } = null!;
}
