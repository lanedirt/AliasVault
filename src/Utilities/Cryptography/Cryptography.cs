using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace Cryptography;

public class Cryptography
{
    public static byte[] DeriveKeyFromPassword(string password, string salt)
    {
        byte[] passwordBytes = Encoding.UTF8.GetBytes(password);
        byte[] saltBytes = Encoding.UTF8.GetBytes(salt);

        var argon2 = new Argon2id(passwordBytes)
        {
            Salt = saltBytes,
            DegreeOfParallelism = 8,
            MemorySize = 65536,
            Iterations = 4
        };

        return argon2.GetBytes(32); // Generate a 256-bit key
    }

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
