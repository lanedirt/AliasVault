using System.Security.Cryptography;

namespace AliasVault.Tests;

public class CryptographyTests
{
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
        Console.Write($"Derived key: {key})");

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
}
