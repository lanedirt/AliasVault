//-----------------------------------------------------------------------
// <copyright file="ConversionUtility.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Utilities;

using HtmlAgilityPack;

/// <summary>
/// Class which contains various helper methods for data conversion.
/// </summary>
public static class ConversionUtility
{
    /// <summary>
    /// Convert all anchor tags to open in a new tab.
    /// </summary>
    /// <param name="html">HTML input.</param>
    /// <returns>HTML with all anchor tags converted to open in a new tab when clicked on.</returns>
    /// <remarks>
    /// Note: same implementation exists in browser extension Typescript version in ConversionUtility.ts.
    /// </remarks>
    public static string ConvertAnchorTagsToOpenInNewTab(string html)
    {
        try
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var anchors = doc.DocumentNode.SelectNodes("//a[@href]");
            if (anchors != null)
            {
                foreach (var anchor in anchors)
                {
                    var targetAttr = anchor.Attributes["target"];
                    if (targetAttr == null)
                    {
                        anchor.SetAttributeValue("target", "_blank");
                    }
                    else if (targetAttr.Value != "_blank")
                    {
                        targetAttr.Value = "_blank";
                    }

                    // Add rel="noopener noreferrer" for security
                    var relAttr = anchor.Attributes["rel"];
                    if (relAttr == null)
                    {
                        anchor.SetAttributeValue("rel", "noopener noreferrer");
                    }
                    else if (!relAttr.Value.Contains("noopener") || !relAttr.Value.Contains("noreferrer"))
                    {
                        var relValues = new HashSet<string>(relAttr.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries));
                        relValues.Add("noopener");
                        relValues.Add("noreferrer");
                        anchor.SetAttributeValue("rel", string.Join(" ", relValues));
                    }
                }
            }

            return doc.DocumentNode.OuterHtml;
        }
        catch (Exception ex)
        {
            // Log the exception
            Console.WriteLine($"Error in ConvertAnchorTagsToOpenInNewTab: {ex.Message}");

            // Return the original HTML if an error occurs
            return html;
        }
    }
}
