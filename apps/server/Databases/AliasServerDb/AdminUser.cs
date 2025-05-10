//-----------------------------------------------------------------------
// <copyright file="AdminUser.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.AspNetCore.Identity;

/// <summary>
/// Admin user extending IdentityUser only used for access to the admin panel.
/// </summary>
public class AdminUser : IdentityUser
{
    /// <summary>
    /// Gets or sets the last time the password was changed.
    /// </summary>
    public DateTime? LastPasswordChanged { get; set; }
}
