//-----------------------------------------------------------------------
// <copyright file="Password.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

/// <summary>
/// Password model.
/// </summary>
public class Password
{
    /// <summary>
    /// Gets or sets the value of the password.
    /// </summary>
    public string Value { get; set; } = null!;

    /// <summary>
    /// Gets or sets the description of the password.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the password was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the password was last updated.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
