//-----------------------------------------------------------------------
// <copyright file="Address.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasGenerators.Identity.Models;

/// <summary>
/// Address model.
/// </summary>
public class Address
{
    /// <summary>
    /// Gets or sets the street.
    /// </summary>
    public string Street { get; set; } = null!;

    /// <summary>
    /// Gets or sets the city.
    /// </summary>
    public string City { get; set; } = null!;

    /// <summary>
    /// Gets or sets the state.
    /// </summary>
    public string State { get; set; } = null!;

    /// <summary>
    /// Gets or sets the zip code.
    /// </summary>
    public string ZipCode { get; set; } = null!;

    /// <summary>
    /// Gets or sets the country.
    /// </summary>
    public string Country { get; set; } = null!;
}
