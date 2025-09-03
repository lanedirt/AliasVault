//-----------------------------------------------------------------------
// <copyright file="TestDefaults.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Common;

/// <summary>
/// Default values for tests.
/// </summary>
public static class TestDefaults
{
    /// <summary>
    /// Gets or sets default timeout while waiting for pages to load in milliseconds.
    /// </summary>
    public static int DefaultTimeout { get; set; } = 30000;
}
