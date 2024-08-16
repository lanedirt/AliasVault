//-----------------------------------------------------------------------
// <copyright file="ResourceReaderUtility.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Common;

using System.Reflection;

/// <summary>
/// Utility for reading strings from project embedded resources used in tests.
/// </summary>
public static class ResourceReaderUtility
{
    /// <summary>
    /// Reads string from embedded resource.
    /// </summary>
    /// <param name="resourceName">Name of the embedded resource.</param>
    /// <returns>Contents of embedded resource as string.</returns>
    /// <exception cref="InvalidOperationException">Thrown when resource is not found with that name.</exception>
    public static async Task<string> ReadEmbeddedResourceAsync(string resourceName)
    {
        var assembly = Assembly.GetExecutingAssembly();

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new InvalidOperationException($"Resource {resourceName} not found in {assembly.FullName}");
        }

        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync();
    }

    /// <summary>
    /// Get all embedded resource names in current assembly.
    /// </summary>
    /// <returns>Array of resource names.</returns>
    public static string[] GetEmbeddedResourceNames()
    {
        return Assembly.GetExecutingAssembly().GetManifestResourceNames();
    }
}
