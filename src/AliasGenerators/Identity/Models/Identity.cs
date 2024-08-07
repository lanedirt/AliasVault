//-----------------------------------------------------------------------
// <copyright file="Identity.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasGenerators.Identity.Models;

/// <summary>
/// Identity model.
/// </summary>
public class Identity
{
    /// <summary>
    /// Gets or sets the id.
    /// </summary>
    public string Id { get; set; } = null!;

    /// <summary>
    /// Gets or sets the gender.
    /// </summary>
    public Gender Gender { get; set; }

    /// <summary>
    /// Gets or sets the first name.
    /// </summary>
    public string FirstName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the last name.
    /// </summary>
    public string LastName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the nickname. This is also used as the username.
    /// </summary>
    public string NickName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the birth date.
    /// </summary>
    public DateTime BirthDate { get; set; }

    /// <summary>
    /// Gets or sets the email address prefix.
    /// </summary>
    public string EmailPrefix { get; set; } = null!;
}
