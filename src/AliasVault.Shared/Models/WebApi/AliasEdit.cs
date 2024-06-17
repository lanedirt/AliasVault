//-----------------------------------------------------------------------
// <copyright file="AliasEdit.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// Alias model.
/// </summary>
public class AliasEdit
{
    /// <summary>
    /// Gets or sets the name of the service.
    /// </summary>
    [Required]
    public string ServiceName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the URL of the service.
    /// </summary>
    public string? ServiceUrl { get; set; }

    /// <summary>
    /// Gets or sets the Alias Identity object.
    /// </summary>
    public Identity Identity { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Alias Password object.
    /// </summary>
    public Password Password { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Alias CreateDate.
    /// </summary>
    public DateTime CreateDate { get; set; }

    /// <summary>
    /// Gets or sets the Alias LastUpdate.
    /// </summary>
    public DateTime LastUpdate { get; set; }
}
