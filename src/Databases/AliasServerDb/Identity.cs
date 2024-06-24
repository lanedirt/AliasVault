//-----------------------------------------------------------------------
// <copyright file="Identity.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasServerDb;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// The identity entity.
/// </summary>
public class Identity
{
    /// <summary>
    /// Gets or sets the identity primary key.
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
    public string? FirstName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the last name.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? LastName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the nickname.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? NickName { get; set; }

    /// <summary>
    /// Gets or sets the birth date.
    /// </summary>
    public DateTime BirthDate { get; set; }

    /// <summary>
    /// Gets or sets the address street.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? AddressStreet { get; set; }

    /// <summary>
    /// Gets or sets the address city.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? AddressCity { get; set; }

    /// <summary>
    /// Gets or sets the address state.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? AddressState { get; set; }

    /// <summary>
    /// Gets or sets the address zip code.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? AddressZipCode { get; set; }

    /// <summary>
    /// Gets or sets the address country.
    /// </summary>
    [StringLength(255)]
    [Column(TypeName = "VARCHAR")]
    public string? AddressCountry { get; set; }

    /// <summary>
    /// Gets or sets the hobbies in CSV format, can contain multiple values separated by ";".
    /// </summary>
    [StringLength(255)]
    public string? Hobbies { get; set; }

    /// <summary>
    /// Gets or sets the generated email prefix.
    /// </summary>
    [StringLength(255)]
    public string? EmailPrefix { get; set; }

    /// <summary>
    /// Gets or sets the random generated mobile phone number.
    /// </summary>
    [StringLength(255)]
    public string? PhoneMobile { get; set; }

    /// <summary>
    /// Gets or sets the generated IBAN bank account number.
    /// </summary>
    [StringLength(255)]
    public string? BankAccountIBAN { get; set; }

    /// <summary>
    /// Gets or sets the created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the login foreign key.
    /// </summary>
    public Guid? DefaultPasswordId { get; set; }

    /// <summary>
    /// Gets or sets the login navigation property.
    /// </summary>
    [ForeignKey("DefaultPasswordId")]
    public virtual Password? DefaultPassword { get; set; }
}
