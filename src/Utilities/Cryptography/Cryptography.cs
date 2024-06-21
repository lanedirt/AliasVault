//-----------------------------------------------------------------------
// <copyright file="Cryptography.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography;

using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

/// <summary>
/// Cryptography class.
/// </summary>
public static class Cryptography
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
    public static async Task<byte[]> DeriveKeyFromPasswordAsync(string password, string salt = "AliasVault")
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
    /// Encrypt a plaintext string using AES-256.
    /// </summary>
    /// <param name="plaintext">The plaintext string.</param>
    /// <param name="key">Key to use for encryption.</param>
    /// <returns>The encrypted string (ciphertext).</returns>
    public static string Encrypt(string plaintext, byte[] key)
    {
        using (Aes aes = Aes.Create())
        {
            aes.Key = key;
            aes.GenerateIV();

            ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

            using (MemoryStream ms = new MemoryStream())
            {
                using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                {
                    using (StreamWriter sw = new StreamWriter(cs))
                    {
                        sw.Write(plaintext);
                    }
                }

                byte[] iv = aes.IV;
                byte[] encryptedContent = ms.ToArray();

                byte[] result = new byte[iv.Length + encryptedContent.Length];
                Buffer.BlockCopy(iv, 0, result, 0, iv.Length);
                Buffer.BlockCopy(encryptedContent, 0, result, iv.Length, encryptedContent.Length);

                return Convert.ToBase64String(result);
            }
        }
    }

    /// <summary>
    /// Decrypt a ciphertext string using AES-256.
    /// </summary>
    /// <param name="ciphertext">The encrypted string (ciphertext).</param>
    /// <param name="key">The key used to originally encrypt the string.</param>
    /// <returns>The original plaintext string.</returns>
    public static string Decrypt(string ciphertext, byte[] key)
    {
        byte[] fullCipher = Convert.FromBase64String(ciphertext);

        byte[] iv = new byte[16];
        byte[] cipher = new byte[fullCipher.Length - iv.Length];

        Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);

        using (Aes aes = Aes.Create())
        {
            aes.Key = key;
            aes.IV = iv;

            ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

            using (MemoryStream ms = new MemoryStream(cipher))
            {
                using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                {
                    using (StreamReader sr = new StreamReader(cs))
                    {
                        return sr.ReadToEnd();
                    }
                }
            }
        }
    }
}
