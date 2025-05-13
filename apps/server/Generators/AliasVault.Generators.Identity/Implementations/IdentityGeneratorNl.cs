//-----------------------------------------------------------------------
// <copyright file="IdentityGeneratorNl.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Generators.Identity.Implementations;

using AliasVault.Generators.Identity.Implementations.Base;

/// <summary>
/// Dutch identity generator which implements IIdentityGenerator and generates
/// random dutch identities.
/// </summary>
public class IdentityGeneratorNl : IdentityGenerator
{
    /// <inheritdoc cref="IdentityGenerator.FirstNamesListMale" />
    protected override string FirstNamesListMale => "AliasVault.Generators.Identity.Implementations.Dictionaries.nl.firstnames_male";

    /// <inheritdoc cref="IdentityGenerator.FirstNamesListFemale" />
    protected override string FirstNamesListFemale => "AliasVault.Generators.Identity.Implementations.Dictionaries.nl.firstnames_female";

    /// <inheritdoc cref="IdentityGenerator.LastNamesList" />
    protected override string LastNamesList => "AliasVault.Generators.Identity.Implementations.Dictionaries.nl.lastnames";
}
