//-----------------------------------------------------------------------
// <copyright file="StaticIdentityGenerator.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasGenerators.Identity.Implementations;

using AliasGenerators.Identity;

/// <summary>
/// Static identity generator which implements IIdentityGenerator but always returns
/// the same static identity for testing purposes.
/// </summary>
public class StaticIdentityGenerator : IIdentityGenerator
{
    /// <inheritdoc/>
    public async Task<Identity.Models.Identity> GenerateRandomIdentityAsync()
    {
        await Task.Yield(); // Add an await statement to make the method truly asynchronous.
        return new Identity.Models.Identity
        {
            FirstName = "John",
            LastName = "Doe",
        };
    }
}
