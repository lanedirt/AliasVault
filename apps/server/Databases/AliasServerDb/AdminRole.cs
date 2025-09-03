//-----------------------------------------------------------------------
// <copyright file="AdminRole.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.AspNetCore.Identity;

/// <summary>
/// Extends IdentityRole with a string type.
/// </summary>
public class AdminRole : IdentityRole
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AdminRole"/> class.
    /// </summary>
    public AdminRole()
        : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AdminRole"/> class.
    /// </summary>
    /// <param name="roleName">Role name.</param>
    public AdminRole(string roleName)
        : base(roleName)
    {
    }
}
