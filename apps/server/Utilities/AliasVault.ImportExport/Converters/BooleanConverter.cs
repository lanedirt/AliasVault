//-----------------------------------------------------------------------
// <copyright file="BooleanConverter.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Converters;

using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.TypeConversion;

/// <summary>
/// Boolean converter for CSV import.
/// </summary>
public class BooleanConverter : DefaultTypeConverter
{
    /// <summary>
    /// Converts a string to a boolean.
    /// </summary>
    /// <param name="text">The string to convert.</param>
    /// <param name="row">The current row.</param>
    /// <param name="memberMapData">The member map data.</param>
    /// <returns>The converted boolean.</returns>
    public override object ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrEmpty(text)) {
            return false;
        }

        var trimmedText = text.ToLowerInvariant().Trim();

        switch (trimmedText) {
            case "1":
            case "true":
            case "yes":
            case "on":
                return true;
            default:
                return false;
        }
    }
}