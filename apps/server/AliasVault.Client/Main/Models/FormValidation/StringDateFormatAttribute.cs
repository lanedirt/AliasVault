//-----------------------------------------------------------------------
// <copyright file="StringDateFormatAttribute.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Main.Models.FormValidation;

using System.ComponentModel.DataAnnotations;
using System.Globalization;

/// <summary>
/// Model validation attribute for date strings.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="StringDateFormatAttribute"/> class.
/// </remarks>
/// <param name="format">The date format to validate.</param>
public sealed class StringDateFormatAttribute(string format) : ValidationAttribute
{
    /// <summary>
    /// Gets or sets a value indicating whether empty strings should be considered valid.
    /// </summary>
    public bool AllowEmpty { get; set; } = false;

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
            if (string.IsNullOrWhiteSpace(dateString) && AllowEmpty)
            {
                return ValidationResult.Success!;
            }

            if (DateTime.TryParseExact(dateString, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            {
                return ValidationResult.Success!;
            }
        }

        return new ValidationResult($"The date must be in the format {format}.", [validationContext.MemberName!]);
    }
}
