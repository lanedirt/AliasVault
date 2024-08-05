//-----------------------------------------------------------------------
// <copyright file="IdentityGeneratorNl.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasGenerators.Identity.Implementations;

using AliasGenerators.Identity.Implementations.Base;

/// <summary>
/// Dutch identity generator which implements IIdentityGenerator and generates
/// random dutch identities.
/// </summary>
public class IdentityGeneratorNl : IdentityGenerator
{
    /// <inheritdoc cref="IdentityGenerator.FirstNamesListMale" />
    protected override string FirstNamesListMale => "AliasGenerators.Identity.Implementations.Dictionaries.nl.firstnames_male";

    /// <inheritdoc cref="IdentityGenerator.FirstNamesListFemale" />
    protected override string FirstNamesListFemale => "AliasGenerators.Identity.Implementations.Dictionaries.nl.firstnames_female";

    /// <inheritdoc cref="IdentityGenerator.LastNamesList" />
    protected override string LastNamesList => "AliasGenerators.Identity.Implementations.Dictionaries.nl.lastnames";
}
