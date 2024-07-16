//-----------------------------------------------------------------------
// <copyright file="Encryption.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography;

using System.Text;
using Konscious.Security.Cryptography;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Security;

/// <summary>
/// Encryption class.
/// </summary>
public static class Encryption
{
    /// <summary>
    /// Derive a key used for encryption/decryption based on a user password and system salt.
    /// </summary>
    /// <param name="password">User password.</param>
    /// <param name="salt">The salt to use for the Argon2id hash.</param>
    /// <returns>Encryption key as byte array.</returns>
    public static byte[] DeriveKeyFromPassword(string password, string salt = "AliasVault")
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

        return argon2.GetBytes(32); // Generate a 256-bit key
    }

    /// <summary>
    /// Derive a key used for encryption/decryption based on a user password and system salt.
    /// </summary>
    /// <param name="password">User password.</param>
    /// <param name="salt">The salt to use for the Argon2id hash.</param>
    /// <returns>Encryption key as byte array.</returns>
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

    /// <summary>
    /// Encrypt a plaintext string using AES-256 GCM.
    /// </summary>
    /// <param name="plaintext">The plaintext string.</param>
    /// <param name="key">Key to use for encryption (must be 32 bytes for AES-256).</param>
    /// <returns>The encrypted string (ciphertext).</returns>
    public static string Encrypt(string plaintext, byte[] key)
    {
        byte[] iv = new byte[12];
        SecureRandom random = new();
        random.NextBytes(iv);

        GcmBlockCipher gcm = new(new AesEngine());
        AeadParameters parameters = new(new KeyParameter(key), 128, iv, null);
        gcm.Init(true, parameters);

        byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        byte[] ciphertextBytes = new byte[gcm.GetOutputSize(plaintextBytes.Length)];
        int outputLength = gcm.ProcessBytes(plaintextBytes, 0, plaintextBytes.Length, ciphertextBytes, 0);
        gcm.DoFinal(ciphertextBytes, outputLength);

        byte[] combined = new byte[iv.Length + ciphertextBytes.Length];
        Array.Copy(iv, 0, combined, 0, iv.Length);
        Array.Copy(ciphertextBytes, 0, combined, iv.Length, ciphertextBytes.Length);

        return Convert.ToBase64String(combined);
    }

    /// <summary>
    /// Decrypt a ciphertext string using AES-256 GCM.
    /// </summary>
    /// <param name="ciphertext">The encrypted string (ciphertext).</param>
    /// <param name="key">The key used to originally encrypt the string.</param>
    /// <returns>The original plaintext string.</returns>
    public static string Decrypt(string ciphertext, byte[] key)
    {
        byte[] fullCipher = Convert.FromBase64String(ciphertext);

        byte[] iv = new byte[12];
        byte[] cipherBytes = new byte[fullCipher.Length - iv.Length];

        Array.Copy(fullCipher, 0, iv, 0, iv.Length);
        Array.Copy(fullCipher, iv.Length, cipherBytes, 0, cipherBytes.Length);

        GcmBlockCipher gcm = new(new AesEngine());
        AeadParameters parameters = new(new KeyParameter(key), 128, iv, null);
        gcm.Init(false, parameters);

        byte[] plaintextBytes = new byte[gcm.GetOutputSize(cipherBytes.Length)];
        int outputLength = gcm.ProcessBytes(cipherBytes, 0, cipherBytes.Length, plaintextBytes, 0);
        gcm.DoFinal(plaintextBytes, outputLength);

        return Encoding.UTF8.GetString(plaintextBytes).TrimEnd('\0');
    }
}
