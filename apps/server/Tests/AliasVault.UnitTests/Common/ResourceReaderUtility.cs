//-----------------------------------------------------------------------
// <copyright file="ResourceReaderUtility.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.UnitTests.Common;

using System.IO;
using System.Reflection;
using System.Threading.Tasks;

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
    public static async Task<string> ReadEmbeddedResourceStringAsync(string resourceName)
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
    /// Reads byte array from embedded resource.
    /// </summary>
    /// <param name="resourceName">Name of the embedded resource.</param>
    /// <returns>Contents of embedded resource as byte array.</returns>
    /// <exception cref="InvalidOperationException">Thrown when resource is not found with that name.</exception>
    public static async Task<byte[]> ReadEmbeddedResourceBytesAsync(string resourceName)
    {
        var assembly = Assembly.GetExecutingAssembly();

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new InvalidOperationException($"Resource {resourceName} not found in {assembly.FullName}");
        }

        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        return memoryStream.ToArray();
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
