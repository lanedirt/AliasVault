//-----------------------------------------------------------------------
// <copyright file="Alias.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AliasClientDb.Abstracts;

/// <summary>
/// The alias entity.
/// </summary>
public class Alias : SyncableEntity
{
    /// <summary>
    /// Gets or sets the alias primary key.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the gender.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? Gender { get; set; }

    /// <summary>
    /// Gets or sets the first name.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? FirstName { get; set; }

    /// <summary>
    /// Gets or sets the last name.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? LastName { get; set; }

    /// <summary>
    /// Gets or sets the nickname.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? NickName { get; set; }

    /// <summary>
    /// Gets or sets the birthdate.
    /// </summary>
    public DateTime BirthDate { get; set; }

    /// <summary>
    /// Gets or sets the generated email.
    /// </summary>
    [StringLength(255)]
    public string? Email { get; set; }

    /// <summary>
    /// Gets or sets the credential objects.
    /// </summary>
    public virtual ICollection<Credential> Credentials { get; set; } = [];
}
