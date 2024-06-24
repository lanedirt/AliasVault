//-----------------------------------------------------------------------
// <copyright file="AliasVaultUser.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.AspNetCore.Identity;

/// <summary>
/// Alias vault user extending IdentityUser with fields for SRP authentication.
/// </summary>
public class AliasVaultUser : IdentityUser
{
    /// <summary>
    /// Gets or sets the salt used for SRP authentication.
    /// </summary>
    public string Salt { get; set; } = null!;

    /// <summary>
    /// Gets or sets the verifier used for SRP authentication.
    /// </summary>
    public string Verifier { get; set; } = null!;
}
