//-----------------------------------------------------------------------
// <copyright file="AliasVaultUserClaim.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.AspNetCore.Identity;

/// <summary>
/// Extends IdentityUserClaim with a string type.
/// </summary>
public class AliasVaultUserClaim : IdentityUserClaim<string>
{
}
