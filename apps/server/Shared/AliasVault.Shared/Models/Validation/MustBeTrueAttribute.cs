//-----------------------------------------------------------------------
// <copyright file="MustBeTrueAttribute.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.Validation;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Validation attribute to ensure that a boolean property is true.
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public class MustBeTrueAttribute : ValidationAttribute
{
    /// <inheritdoc />
    public override bool IsValid(object? value)
    {
        switch (value)
        {
            case null:
                return false;
            case bool b:
                return b;
            default:
                throw new InvalidOperationException("Can only be used on boolean properties.");
        }
    }
}
