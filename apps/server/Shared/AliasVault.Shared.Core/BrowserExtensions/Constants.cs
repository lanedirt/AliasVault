//-----------------------------------------------------------------------
// <copyright file="Constants.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
#pragma warning disable S1075 // URIs should not be hardcoded

namespace AliasVault.Shared.Core.BrowserExtensions;

/// <summary>
/// Provides constants for browser extension information.
/// </summary>
public static class Constants
{
    /// <summary>
    /// Gets the browser extensions available for AliasVault. This is used to render download links in the client.
    /// </summary>
    public static IReadOnlyDictionary<BrowserType, BrowserExtensionInfo> Extensions { get; } = new Dictionary<BrowserType, BrowserExtensionInfo>
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
            DownloadUrl = "https://addons.mozilla.org/en-US/firefox/addon/aliasvault/",
            IsAvailable = true,
        },
        [BrowserType.Safari] = new BrowserExtensionInfo
        {
            Name = "Safari",
            IconPath = "/img/browser-icons/safari.svg",
            DownloadUrl = "https://apps.apple.com/app/6743163173",
            IsAvailable = true,
        },
        [BrowserType.Edge] = new BrowserExtensionInfo
        {
            Name = "Microsoft Edge",
            IconPath = "/img/browser-icons/edge.svg",
            DownloadUrl = "https://microsoftedge.microsoft.com/addons/detail/aliasvault/kabaanafahnjkfkplbnllebdmppdemfo",
            IsAvailable = true,
        },
        [BrowserType.Brave] = new BrowserExtensionInfo
        {
            Name = "Brave",
            IconPath = "/img/browser-icons/brave.svg",
            DownloadUrl = "https://chromewebstore.google.com/detail/aliasvault/bmoggiinmnodjphdjnmpcnlleamkfedj",
            IsAvailable = true,
        },
    };
}
