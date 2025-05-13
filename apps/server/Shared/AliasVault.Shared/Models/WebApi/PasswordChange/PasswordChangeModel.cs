//-----------------------------------------------------------------------
// <copyright file="PasswordChangeModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.PasswordChange;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Password change model.
/// </summary>
public class PasswordChangeModel
{
    /// <summary>
    /// Gets or sets the current password.
    /// </summary>
    [Required]
    public string CurrentPassword { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    [Required]
    [MinLength(8, ErrorMessage = "The new password must be at least 8 characters long.")]
    public string NewPassword { get; set; } = null!;

    /// <summary>
    /// Gets or sets the password confirmation.
    /// </summary>
    [Required]
    [Compare("NewPassword", ErrorMessage = "The new passwords do not match.")]
    public string NewPasswordConfirm { get; set; } = null!;
}
