//-----------------------------------------------------------------------
// <copyright file="MobileAppInfo.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Core.MobileApps;

/// <summary>
/// Represents information about a mobile app.
/// </summary>
public class MobileAppInfo
{
    /// <summary>
    /// Gets or sets the name of the mobile app.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the path to the icon of the mobile app.
    /// </summary>
    public string IconPath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the download URL for the mobile app.
    /// </summary>
    public string DownloadUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets a value indicating whether the mobile app is available.
    /// </summary>
    public bool IsAvailable { get; set; }
}
