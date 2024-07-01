//-----------------------------------------------------------------------
// <copyright file="FaviconExtractModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models;

/// <summary>
/// FaviconExtractModel model.
/// </summary>
public class FaviconExtractModel
{
    /// <summary>
    /// Gets or sets favicon image as byte array.
    /// </summary>
    public byte[]? Image { get; set; } = null!;
}
