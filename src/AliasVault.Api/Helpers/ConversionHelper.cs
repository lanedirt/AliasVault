//-----------------------------------------------------------------------
// <copyright file="ConversionHelper.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Helpers;

using System.Text.RegularExpressions;

/// <summary>
/// Class which contains various helper methods for data conversion.
/// </summary>
public static class ConversionHelper
{
    /// <summary>
    /// Extract only displayname from full "From" string. E.g. "John Doe" [johndoe@john.com] becomes "John Doe".
    /// </summary>
    /// <param name="from">The full from string.</param>
    /// <returns>Stripped displayname.</returns>
    public static string ConvertFromToFromDisplay(string from)
    {
        // Get the display name from the From field, which is everything before the first < and after the first >
        string fromDisplay = from;
        if (!from.Contains('<'))
        {
            return fromDisplay;
        }

        // Remove everything after the last < until the last >
        fromDisplay = from.Substring(0, from.LastIndexOf('<'));

        // Remove any double quotes
        fromDisplay = fromDisplay.Replace("\"", string.Empty);

        // Trim any whitespace
        fromDisplay = fromDisplay.Trim();

        return fromDisplay;
    }

    /// <summary>
    /// Convert all anchor tags to open in a new tab.
    /// </summary>
    /// <param name="html">HTML input.</param>
    /// <returns>HTML with all anchor tags converted to open in a new tab when clicked on.</returns>
    public static string ConvertAnchorTagsToOpenInNewTab(string html)
    {
        // Match any <a tag with href attribute, regardless of the position of href or other attributes
        html = Regex.Replace(
            html,
            @"<a\s+(.*?)href=([""'])(.*?)\2(.*?)>",
            m => $"<a {m.Groups[1].Value}href={m.Groups[2].Value}{m.Groups[3].Value}{m.Groups[2].Value} {m.Groups[4].Value} target=\"_blank\">",
            RegexOptions.IgnoreCase | RegexOptions.Singleline,
            TimeSpan.FromSeconds(1));

        return html;
    }
}
