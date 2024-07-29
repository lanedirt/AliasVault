//-----------------------------------------------------------------------
// <copyright file="Encryption.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography;

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Konscious.Security.Cryptography;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Security;

/// <summary>
/// SrpArgonEncryption class.
/// </summary>
public static class Encryption
{
    /// <summary>
    /// Generates a random symmetric key for use with AES-256.
    /// </summary>
    /// <returns>A 256-bit (32-byte) random key as a byte array.</returns>
    public static byte[] GenerateRandomSymmetricKey()
    {
        return RandomNumberGenerator.GetBytes(32); // 256 bits
    }

    /// <summary>
    /// Encrypts a symmetric key using an RSA public key.
    /// </summary>
    /// <param name="symmetricKey">The symmetric key to encrypt.</param>
    /// <param name="publicKey">The RSA public key in JWK format.</param>
    /// <returns>The encrypted symmetric key as a base64-encoded string.</returns>
    public static string EncryptSymmetricKeyWithRsa(byte[] symmetricKey, string publicKey)
    {
        using (var rsa = RSA.Create())
        {
            ImportPublicKey(rsa, publicKey);
            rsa.KeySize = 2048;
            var rsaParams = RSAEncryptionPadding.OaepSHA256;

            byte[] encryptedKey = rsa.Encrypt(symmetricKey, rsaParams);
            return Convert.ToBase64String(encryptedKey);
        }
    }

    /// <summary>
    /// Decrypts an encrypted symmetric key using an RSA private key.
    /// </summary>
    /// <param name="ciphertext">The encrypted symmetric key as ciphertext.</param>
    /// <param name="privateKey">The RSA private key in JWK format.</param>
    /// <returns>The encrypted symmetric key as a base64-encoded string.</returns>
    public static byte[] DecryptSymmetricKeyWithRsa(string ciphertext, string privateKey)
    {
        using (var rsa = RSA.Create())
        {
            ImportPrivateKey(rsa, privateKey);
            rsa.KeySize = 2048;
            var rsaParams = RSAEncryptionPadding.OaepSHA256;

            byte[] cipherBytes = Convert.FromBase64String(ciphertext);
            return rsa.Decrypt(cipherBytes, rsaParams);
        }
    }

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

    /// <summary>
    /// SymmetricEncrypt a plaintext string using AES-256 GCM.
    /// </summary>
    /// <param name="plaintext">The plaintext string.</param>
    /// <param name="key">Key to use for encryption (must be 32 bytes for AES-256).</param>
    /// <returns>The encrypted string (ciphertext).</returns>
    public static string SymmetricEncrypt(string plaintext, byte[] key)
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
    /// SymmetricDecrypt a ciphertext string using AES-256 GCM.
    /// </summary>
    /// <param name="ciphertext">The encrypted string (ciphertext).</param>
    /// <param name="key">The key used to originally encrypt the string.</param>
    /// <returns>The original plaintext string.</returns>
    public static string SymmetricDecrypt(string ciphertext, byte[] key)
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

    /// <summary>
    /// Encrypts a plaintext string using an RSA public key.
    /// </summary>
    /// <param name="plaintext">The plaintext to encrypt.</param>
    /// <param name="publicKey">The public key in XML format.</param>
    /// <returns>The encrypted data as a base64-encoded string.</returns>
    public static string EncryptWithPublicKey(string plaintext, string publicKey)
    {
        using (var rsa = new RSACryptoServiceProvider())
        {
            ImportPublicKey(rsa, publicKey);
            byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            byte[] cipherBytes = rsa.Encrypt(plaintextBytes, true);
            return Convert.ToBase64String(cipherBytes);
        }
    }

    /// <summary>
    /// Decrypts a ciphertext string using an RSA private key.
    /// </summary>
    /// <param name="ciphertext">The base64-encoded ciphertext to decrypt.</param>
    /// <param name="privateKey">The private key in XML format.</param>
    /// <returns>The decrypted plaintext.</returns>
    public static string DecryptWithPrivateKey(string ciphertext, string privateKey)
    {
        using (var rsa = new RSACryptoServiceProvider())
        {
            ImportPrivateKey(rsa, privateKey);
            byte[] cipherBytes = Convert.FromBase64String(ciphertext);
            byte[] plaintextBytes = rsa.Decrypt(cipherBytes, true);
            return Encoding.UTF8.GetString(plaintextBytes);
        }
    }

    /// <summary>
    /// Imports a public key from JWK format into an RSA provider.
    /// </summary>
    /// <param name="rsa">The RSA provider to import the key into.</param>
    /// <param name="jwk">The public key in JWK format.</param>
    private static void ImportPublicKey(RSA rsa, string jwk)
    {
        var jwkObj = JsonSerializer.Deserialize<JsonElement>(jwk);
        var n = Base64UrlDecode(jwkObj.GetProperty("n").GetString()!);
        var e = Base64UrlDecode(jwkObj.GetProperty("e").GetString()!);

        var rsaParameters = new RSAParameters
        {
            Modulus = n,
            Exponent = e,
        };

        rsa.ImportParameters(rsaParameters);
    }

    /// <summary>
    /// Imports a private key from JWK format into an RSA provider.
    /// </summary>
    /// <param name="rsa">The RSA provider to import the key into.</param>
    /// <param name="jwk">The private key in JWK format.</param>
    private static void ImportPrivateKey(RSA rsa, string jwk)
    {
        var jwkObj = JsonSerializer.Deserialize<JsonElement>(jwk);
        var n = Base64UrlDecode(jwkObj.GetProperty("n").GetString()!);
        var e = Base64UrlDecode(jwkObj.GetProperty("e").GetString()!);
        var d = Base64UrlDecode(jwkObj.GetProperty("d").GetString()!);
        var p = Base64UrlDecode(jwkObj.GetProperty("p").GetString()!);
        var q = Base64UrlDecode(jwkObj.GetProperty("q").GetString()!);
        var dp = Base64UrlDecode(jwkObj.GetProperty("dp").GetString()!);
        var dq = Base64UrlDecode(jwkObj.GetProperty("dq").GetString()!);
        var qi = Base64UrlDecode(jwkObj.GetProperty("qi").GetString()!);

        var rsaParameters = new RSAParameters
        {
            Modulus = n,
            Exponent = e,
            D = d,
            P = p,
            Q = q,
            DP = dp,
            DQ = dq,
            InverseQ = qi,
        };

        rsa.ImportParameters(rsaParameters);
    }

    /// <summary>
    /// Decodes a Base64Url-encoded string to a byte array.
    /// </summary>
    /// <param name="base64Url">The Base64Url-encoded string.</param>
    /// <returns>The decoded byte array.</returns>
    private static byte[] Base64UrlDecode(string base64Url)
    {
        string padded = base64Url;
        switch (base64Url.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }

        string base64 = padded.Replace("-", "+").Replace("_", "/");
        return Convert.FromBase64String(base64);
    }
}
