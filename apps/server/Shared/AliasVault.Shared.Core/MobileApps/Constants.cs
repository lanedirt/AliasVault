//-----------------------------------------------------------------------
// <copyright file="Constants.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
#pragma warning disable S1075 // URIs should not be hardcoded

namespace AliasVault.Shared.Core.MobileApps;

/// <summary>
/// Provides constants for mobile app information.
/// </summary>
public static class Constants
{
    /// <summary>
    /// Gets the mobile apps available for AliasVault. This is used to render download links in the client.
    /// </summary>
    public static IReadOnlyList<MobileAppInfo> MobileApps { get; } = new List<MobileAppInfo>
    {
        new MobileAppInfo
        {
            Name = "iOS",
            IconPath = "/img/mobile-icons/ios.svg",
            DownloadUrl = "https://apps.apple.com/app/id6745490915",
            IsAvailable = true,
        },
        new MobileAppInfo
        {
            Name = "Android",
            IconPath = "/img/mobile-icons/android.svg",
            DownloadUrl = "https://play.google.com/store/apps/details?id=com.aliasvault.app",
            IsAvailable = false,
        },
    };
}
