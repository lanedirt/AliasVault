//-----------------------------------------------------------------------
// <copyright file="CryptographyTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Tests;

using System.Security.Cryptography;

/// <summary>
/// Tests for the Cryptography class.
/// </summary>
public class CryptographyTests
{
    /// <summary>
    /// Common setup for all tests.
    /// </summary>
    [SetUp]
    public void Setup()
    {
    }

    /// <summary>
    /// Test basic encryption and decryption using default encryption logic (Argon2id and AES-256).
    /// </summary>
    [Test]
    public void TestBasicEncrypt()
    {
        string password = "your-password";
        string salt = "your-salt"; // Use a secure random salt in production

        string plaintext = "Hello, World!";

        // Derive a key from the password using Argon2id
        byte[] key = Cryptography.Cryptography.DeriveKeyFromPassword(password, salt);
        Console.WriteLine($"Derived key: {key.Length} bytes (hex: {BitConverter.ToString(key).Replace("-", string.Empty)})");

        // Encrypt the plaintext
        string encrypted = Cryptography.Cryptography.Encrypt(plaintext, key);
        Console.WriteLine($"Encrypted: {encrypted}");

        Assert.That(encrypted, Is.Not.Null);
        Assert.That(encrypted, Is.Not.Empty);
        Assert.That(encrypted, Is.Not.EqualTo(plaintext));

        // Decrypt the ciphertext
        string decrypted = Cryptography.Cryptography.Decrypt(encrypted, key);
        Console.WriteLine($"Decrypted: {decrypted}");
        Assert.That(decrypted, Is.EqualTo(plaintext));
    }

    /// <summary>
    /// Test basic encryption and decryption using default encryption logic (Argon2id and AES-256).
    /// </summary>
    [Test]
    public void TestNotEqualsPassword()
    {
        string password = "your-password";
        string salt = "your-salt"; // Use a secure random salt in production

        string plaintext = "Hello, World!";

        // Derive a key from the password using Argon2id
        byte[] key = Cryptography.Cryptography.DeriveKeyFromPassword(password, salt);

        // Encrypt the plaintext
        string encrypted = Cryptography.Cryptography.Encrypt(plaintext, key);

        // Decrypt the ciphertext using a different key
        byte[] key2 = Cryptography.Cryptography.DeriveKeyFromPassword("your-password2", salt);

        Assert.Throws<CryptographicException>(() => Cryptography.Cryptography.Decrypt(encrypted, key2));
    }

    /// <summary>
    /// Test the SRP authentication flow to ensure it works correctly.
    /// </summary>
    [Test]
    public void TestSRPAuthentication()
    {
        var email = "test@example.com";
        var password = "myPassword";
        var argon2IdSalt = "AliasVault";

        // Registration -----------------------------

        // Derive a key from the password using Argon2id
        byte[] passwordHash = Cryptography.Cryptography.DeriveKeyFromPassword(password, argon2IdSalt);

        // Convert to string
        string passwordHashString = BitConverter.ToString(passwordHash).Replace("-", string.Empty);

        // Client generates a salt and verifier.
        string salt = Cryptography.Srp.GenerateSalt()!;
        string verifier = Cryptography.Srp.GenerateVerifier(email, passwordHashString, salt);

        // Login -----------------------------------
        // 1. Client generates an ephemeral value.
        var clientEphemeral = Cryptography.Srp.GenerateEphemeral();

        // --> Then client sends request to server.

        // 2. Server retrieves salt and verifier from database.
        // Then server generates an ephemeral value as well.
        var serverEphemeral = Cryptography.Srp.GenerateEphemeral();

        // --> Send serverEphemeral.Public to client.

        // 3. Client derives shared session key.
        var clientSession = Cryptography.Srp.DeriveSessionClient(passwordHashString, clientEphemeral.Secret, serverEphemeral.Public, salt, email);

        // --> send session.Proof to server.

        // 4. Server verifies the proof.
        var serverSession = Cryptography.Srp.DeriveSessionServer(serverEphemeral.Secret, clientEphemeral.Public, salt, email, verifier, clientSession.Proof);

        // --> send serverSession.Proof to client.

        // 5. Client verifies the proof.
        Cryptography.Srp.VerifySession(clientEphemeral.Public, clientSession, serverSession.Proof);
    }
}
