//-----------------------------------------------------------------------
// <copyright file="Encryption.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography.Client;

using System.Text;
using Konscious.Security.Cryptography;

/// <summary>
/// RSA/AES and Argon2id encryption methods.
/// </summary>
public static class Encryption
{
    /// <summary>
    /// Derive a key used for encryption/decryption based on a user password and system salt.
    /// </summary>
    /// <param name="password">User password.</param>
    /// <param name="salt">The salt to use for the Argon2id hash.</param>
    /// <returns>SrpArgonEncryption key as byte array.</returns>
    public static async Task<byte[]> DeriveKeyFromPasswordAsync(string password, string salt)
    {
        byte[] passwordBytes = Encoding.UTF8.GetBytes(password);
        byte[] saltBytes = Encoding.UTF8.GetBytes(salt);

        var argon2 = new Argon2id(passwordBytes)
        {
            Salt = saltBytes,
            DegreeOfParallelism = 4,
            MemorySize = 8192,
            Iterations = 1,
        };

        return await argon2.GetBytesAsync(32); // Generate a 256-bit key
    }
}
