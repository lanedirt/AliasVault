//-----------------------------------------------------------------------
// <copyright file="Encryption.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Cryptography.Client;

using System.Text;
using System.Text.Json;
using Konscious.Security.Cryptography;

/// <summary>
/// Key derivation algorithms used for encryption/decryption.
/// </summary>
public static class Encryption
{
    /// <summary>
    /// Derive a key used for encryption/decryption based on a user password and system salt.
    /// </summary>
    /// <param name="password">User password.</param>
    /// <param name="salt">The salt to use for the Argon2id hash.</param>
    /// <param name="encryptionType">The encryption type to use. Defaults to <see cref="Defaults.EncryptionType"/>.</param>
    /// <param name="encryptionSettings">The encryption settings to use. Defaults to settings as defined in <see cref="Defaults"/>.</param>
    /// <returns>Key derived from plain-text password as byte array.</returns>
    public static async Task<byte[]> DeriveKeyFromPasswordAsync(string password, string salt, string? encryptionType = null, string? encryptionSettings = null)
    {
        if (encryptionType is null)
        {
            encryptionType = Defaults.EncryptionType;
        }

        byte[] passwordBytes = Encoding.UTF8.GetBytes(password);
        byte[] saltBytes = Encoding.UTF8.GetBytes(salt);

        switch (encryptionType)
        {
            case "Argon2Id":
                return await Argon2Id(passwordBytes, saltBytes, encryptionSettings);
            default:
                throw new NotSupportedException($"Encryption type {encryptionType} is not supported.");
        }
    }

    /// <summary>
    /// Derive a key using Argon2id algorithm.
    /// </summary>
    /// <param name="passwordBytes">Password bytes.</param>
    /// <param name="saltBytes">Salt bytes.</param>
    /// <param name="encryptionSettings">Encryption settings JSON string.</param>
    /// <returns>Key derived from plain-text password as byte array.</returns>
    private static async Task<byte[]> Argon2Id(byte[] passwordBytes, byte[] saltBytes, string? encryptionSettings = null)
    {
        var degreeOfParallelism = Defaults.Argon2IdDegreeOfParallelism;
        var memorySize = Defaults.Argon2IdMemorySize;
        var iterations = Defaults.Argon2IdIterations;

        if (encryptionSettings is not null)
        {
            // Parse the encryption properties json string.
            var properties = JsonSerializer.Deserialize<Dictionary<string, int>>(encryptionSettings);
            if (properties is not null)
            {
                if (properties.TryGetValue("DegreeOfParallelism", out int doP))
                {
                    degreeOfParallelism = doP;
                }

                if (properties.TryGetValue("MemorySize", out int memSize))
                {
                    memorySize = memSize;
                }

                if (properties.TryGetValue("Iterations", out int iter))
                {
                    iterations = iter;
                }
            }
        }

        var argon2 = new Argon2id(passwordBytes)
        {
            Salt = saltBytes,
            DegreeOfParallelism = degreeOfParallelism,
            MemorySize = memorySize,
            Iterations = iterations,
        };

        return await argon2.GetBytesAsync(32); // Generate a 256-bit key
    }
}
