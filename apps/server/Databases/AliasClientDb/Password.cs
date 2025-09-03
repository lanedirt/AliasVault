//-----------------------------------------------------------------------
// <copyright file="Password.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasClientDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AliasClientDb.Abstracts;

/// <summary>
/// Password entity.
/// </summary>
public class Password : SyncableEntity
{
    /// <summary>
    /// Gets or sets the password primary key.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the password value.
    /// </summary>
    [StringLength(255)]
    public string? Value { get; set; }

    /// <summary>
    /// Gets or sets the credential foreign key.
    /// </summary>
    public Guid CredentialId { get; set; }

    /// <summary>
    /// Gets or sets the credential navigation property.
    /// </summary>
    [ForeignKey("CredentialId")]
    public virtual Credential Credential { get; set; } = null!;
}
