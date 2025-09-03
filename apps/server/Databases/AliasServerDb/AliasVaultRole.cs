//-----------------------------------------------------------------------
// <copyright file="AliasVaultRole.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.AspNetCore.Identity;

/// <summary>
/// Extends IdentityRole with a string type.
/// </summary>
public class AliasVaultRole : IdentityRole
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AliasVaultRole"/> class.
    /// </summary>
    public AliasVaultRole()
        : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AliasVaultRole"/> class.
    /// </summary>
    /// <param name="roleName">Role name.</param>
    public AliasVaultRole(string roleName)
        : base(roleName)
    {
    }
}
