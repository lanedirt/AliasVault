//-----------------------------------------------------------------------
// <copyright file="BreadcrumbItem.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Main.Models;

/// <summary>
/// Breadcrumb item model.
/// </summary>
public class BreadcrumbItem
{
    /// <summary>
    /// Gets or sets the display name.
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Gets or sets the URL.
    /// </summary>
    public string? Url { get; set; }
}
