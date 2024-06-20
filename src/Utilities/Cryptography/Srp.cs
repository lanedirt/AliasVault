//-----------------------------------------------------------------------
// <copyright file="Srp.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography;

using System.Security.Cryptography;
using SecureRemotePassword;

/// <summary>
/// SRP is a secure remote password protocol that allows a user to authenticate themselves
/// to a server without sending the password over the network.
/// </summary>
public class Srp
{
    /// <summary>
    /// Generate a random salt.
    /// </summary>
    /// <returns>Byte array.</returns>
    public static string? GenerateSalt()
    {
        var client = new SrpClient();
        var salt = client.GenerateSalt();
        return salt;
    }

    /// <summary>
    /// Generate a verifier for a user.
    /// </summary>
    /// <param name="email">Email.</param>
    /// <param name="passwordHash">Hash as output of Argon2id.</param>
    /// <param name="salt">Salt.</param>
    /// <returns>Verifier as string.</returns>
    public static string GenerateVerifier(string email, string passwordHash, string salt)
    {
        var client = new SrpClient();
        var privateKey = client.DerivePrivateKey(salt, email, passwordHash);
        var verifier = client.DeriveVerifier(privateKey);
        return verifier;
    }

    /// <summary>
    /// Generate an ephemeral value for the client.
    /// </summary>
    /// <returns>Ephemeral as string.</returns>
    public static SrpEphemeral GenerateEphemeral()
    {
        var client = new SrpClient();
        return client.GenerateEphemeral();
    }

    /// <summary>
    /// Derive a shared session key on the client side.
    /// </summary>
    /// <param name="passwordHash">Password hash.</param>
    /// <param name="clientEphemeralSecret">Client ephemeral secret.</param>
    /// <param name="serverPublicEphemeral">Server public ephemeral.</param>
    /// <param name="salt">Salt.</param>
    /// <param name="email">Email.</param>
    /// <returns>session.</returns>
    public static SrpSession DeriveSessionClient(string passwordHash, string clientEphemeralSecret, string serverPublicEphemeral, string salt, string email)
    {
        var client = new SrpClient();
        var privateKey = client.DerivePrivateKey(salt, email, passwordHash);
        return client.DeriveSession(
            clientEphemeralSecret,
            serverPublicEphemeral,
            salt,
            email,
            privateKey);
    }

    /// <summary>
    /// Derive a shared session key on the server side.
    /// </summary>
    /// <param name="serverEphemeralSecret">serverEphemeralSecret.</param>
    /// <param name="clientEphemeralPublic">clientEphemeralPublic.</param>
    /// <param name="salt">Salt.</param>
    /// <param name="email">Email.</param>
    /// <param name="verifier">Verifier.</param>
    /// <param name="clientSessionProof">Client session proof.</param>
    /// <returns>SrpSession.</returns>
    public static SrpSession DeriveSessionServer(string serverEphemeralSecret, string clientEphemeralPublic, string salt, string email, string verifier, string clientSessionProof)
    {
        var server = new SrpServer();
        return server.DeriveSession(
            serverEphemeralSecret,
            clientEphemeralPublic,
            salt,
            email,
            verifier,
            clientSessionProof);
    }

    /// <summary>
    /// Verify the session on the client side.
    /// </summary>
    /// <param name="clientEphemeralPublic">clientEphemeralPublic.</param>
    /// <param name="clientSession">clientSession.</param>
    /// <param name="serverSessionProof">serverSessionProof.</param>
    public static void VerifySession(string clientEphemeralPublic, SrpSession clientSession, string serverSessionProof)
    {
        var client = new SrpClient();
        client.VerifySession(clientEphemeralPublic, clientSession, serverSessionProof);
    }
}
