//-----------------------------------------------------------------------
// <copyright file="StringDateFormatAttribute.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Models.FormValidators;

using System.ComponentModel.DataAnnotations;
using System.Globalization;

/// <summary>
/// Model validation attribute for date strings.
/// </summary>
public class StringDateFormatAttribute : ValidationAttribute
{
    private readonly string _format;

    /// <summary>
    /// Initializes a new instance of the <see cref="StringDateFormatAttribute"/> class.
    /// </summary>
    /// <param name="format">The date format to validate.</param>
    public StringDateFormatAttribute(string format)
    {
        _format = format;
    }

    /// <summary>
    /// Check if the date string is in the correct format.
    /// </summary>
    /// <param name="value">The field value.</param>
    /// <param name="validationContext">ValidationContext.</param>
    /// <returns>ValidationResult.</returns>
    protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
    {
        if (value is string dateString)
        {
            if (DateTime.TryParseExact(dateString, _format, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            {
                return ValidationResult.Success!;
            }
        }

        return new ValidationResult($"The date must be in the format {_format}.", new List<string> { validationContext.MemberName! });
    }
}
