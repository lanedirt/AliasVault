//-----------------------------------------------------------------------
// <copyright file="MustBeTrueAttribute.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.Validation;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Validation attribute to ensure that a boolean property is true.
/// </summary>
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
