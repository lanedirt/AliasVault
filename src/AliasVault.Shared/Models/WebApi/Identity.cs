//-----------------------------------------------------------------------
// <copyright file="Identity.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

/// <summary>
/// Identity model.
/// </summary>
public class Identity
{
    /// <summary>
    /// Gets or sets the identity id.
    /// </summary>
    public Guid Id { get; set; }

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
    public string? BirthDate { get; set; }

    /// <summary>
    /// Gets or sets the street address.
    /// </summary>
    public string? AddressStreet { get; set; }

    /// <summary>
    /// Gets or sets the city.
    /// </summary>
    public string? AddressCity { get; set; }

    /// <summary>
    /// Gets or sets the state.
    /// </summary>
    public string? AddressState { get; set; }

    /// <summary>
    /// Gets or sets the zip code.
    /// </summary>
    public string? AddressZipCode { get; set; }

    /// <summary>
    /// Gets or sets the country.
    /// </summary>
    public string? AddressCountry { get; set; }

    /// <summary>
    /// Gets or sets the hobbies.
    /// </summary>
    public string? Hobbies { get; set; }

    /// <summary>
    /// Gets or sets the email prefix.
    /// </summary>
    public string? EmailPrefix { get; set; }

    /// <summary>
    /// Gets or sets the mobile phone number.
    /// </summary>
    public string? PhoneMobile { get; set; }

    /// <summary>
    /// Gets or sets the bank account IBAN.
    /// </summary>
    public string? BankAccountIBAN { get; set; }

    /// <summary>
    /// Gets or sets the date and time of creation.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time of last update.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the default password.
    /// </summary>
    public Password? DefaultPassword { get; set; }
}
