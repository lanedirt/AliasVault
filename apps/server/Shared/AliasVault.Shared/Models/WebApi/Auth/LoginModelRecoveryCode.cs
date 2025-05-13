//-----------------------------------------------------------------------
// <copyright file="LoginModelRecoveryCode.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Login model for two factor authentication step using a recovery code.
/// </summary>
public class LoginModelRecoveryCode
{
    /// <summary>
    /// Gets or sets the recovery code.
    /// </summary>
    [Required]
    public string RecoveryCode { get; set; } = null!;
}
