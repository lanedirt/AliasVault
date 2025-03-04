//-----------------------------------------------------------------------
// <copyright file="Constants.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Core.BrowserExtensions;

/// <summary>
/// Provides constants for browser extension information.
/// </summary>
public static class Constants
{
    /// <summary>
    /// Gets the browser extensions available for AliasVault. This is used to render download links in the client.
    /// </summary>
    public static readonly Dictionary<BrowserType, BrowserExtensionInfo> Extensions = new()
    {
        [BrowserType.Chrome] = new BrowserExtensionInfo
        {
            Name = "Google Chrome",
            IconPath = "/img/browser-icons/chrome.svg",
            DownloadUrl = "https://chromewebstore.google.com/detail/aliasvault/bmoggiinmnodjphdjnmpcnlleamkfedj",
            IsAvailable = true,
        },
        [BrowserType.Firefox] = new BrowserExtensionInfo
        {
            Name = "Firefox",
            IconPath = "/img/browser-icons/firefox.svg",
            IsAvailable = false,
        },
        [BrowserType.Safari] = new BrowserExtensionInfo
        {
            Name = "Safari",
            IconPath = "/img/browser-icons/safari.svg",
            IsAvailable = false,
        },
        [BrowserType.Edge] = new BrowserExtensionInfo
        {
            Name = "Microsoft Edge",
            IconPath = "/img/browser-icons/edge.svg",
            IsAvailable = false,
        },
        [BrowserType.Brave] = new BrowserExtensionInfo
        {
            Name = "Brave",
            IconPath = "/img/browser-icons/brave.svg",
            IsAvailable = false,
        },
    };
}
