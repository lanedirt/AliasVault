//-----------------------------------------------------------------------
// <copyright file="Service.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

/// <summary>
/// Service model.
/// </summary>
public class Service
{
    /// <summary>
    /// Gets or sets the name of the service.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Gets or sets the description of the service.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the URL of the service.
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// Gets or sets the logo URL of the service.
    /// </summary>
    public string? LogoUrl { get; set; }

    /// <summary>
    /// Gets or sets the creation date and time of the service.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the last updated date and time of the service.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
