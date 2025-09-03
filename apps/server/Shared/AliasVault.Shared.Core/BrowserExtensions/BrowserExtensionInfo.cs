//-----------------------------------------------------------------------
// <copyright file="BrowserExtensionInfo.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Core.BrowserExtensions;

/// <summary>
/// Provides information about a browser extension that is available for AliasVault.
/// </summary>
public class BrowserExtensionInfo
{
    /// <summary>
    /// Gets or sets the name of the browser extension.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the path to the icon of the browser extension.
    /// </summary>
    public string IconPath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the URL to download the browser extension.
    /// </summary>
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the browser extension is available.
    /// </summary>
    public bool IsAvailable { get; set; }
}
