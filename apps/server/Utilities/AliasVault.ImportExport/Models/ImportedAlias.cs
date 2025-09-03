//-----------------------------------------------------------------------
// <copyright file="ImportedAlias.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Models;

/// <summary>
/// Represents an alias in an intermediary format that is imported from various sources.
/// This model is designed to be flexible enough to handle different import formats while
/// maintaining all the essential fields needed for AliasVault aliases.
/// </summary>
public class ImportedAlias
{
    /// <summary>
    /// Gets or sets the gender.
    /// </summary>
    public string? Gender { get; set; }

    /// <summary>
    /// Gets or sets the first name.
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Gets or sets the last name.
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Gets or sets the nickname.
    /// </summary>
    public string? NickName { get; set; }

    /// <summary>
    /// Gets or sets the birth date.
    /// </summary>
    public DateTime? BirthDate { get; set; }

    /// <summary>
    /// Gets or sets the creation date.
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the last update date.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}