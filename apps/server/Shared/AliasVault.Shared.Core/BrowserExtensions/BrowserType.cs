//-----------------------------------------------------------------------
// <copyright file="BrowserType.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Core.BrowserExtensions;

/// <summary>
/// The type of browser.
/// </summary>
public enum BrowserType
{
    /// <summary>
    /// Unknown browser type.
    /// </summary>
    Unknown,

    /// <summary>
    /// Firefox browser type.
    /// </summary>
    Firefox,

    /// <summary>
    /// Chrome browser type.
    /// </summary>
    Chrome,

    /// <summary>
    /// Safari browser type.
    /// </summary>
    Safari,

    /// <summary>
    /// Edge browser type.
    /// </summary>
    Edge,

    /// <summary>
    /// Brave browser type.
    /// </summary>
    Brave,
}
