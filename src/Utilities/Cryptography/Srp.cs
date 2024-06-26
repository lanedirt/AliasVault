//-----------------------------------------------------------------------
// <copyright file="Srp.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography;

using Cryptography.Models;
using SecureRemotePassword;

/// <summary>
/// SRP is a secure remote password protocol that allows a user to authenticate themselves
/// to a server without sending the password over the network.
/// </summary>
public static class Srp
{
    /// <summary>
    /// Prepare signup step.
    /// </summary>
    /// <param name="client">SrpClient.</param>
    /// <param name="salt">Salt.</param>
    /// <param name="email">Email.</param>
    /// <param name="passwordHashString">Hashed password string.</param>
    /// <returns>SrpSignup model.</returns>
    public static SrpSignup SignupPrepareAsync(SrpClient client, string salt, string email, string passwordHashString)
    {
        // Derive a key from the password using Argon2id

        // Signup: client generates a salt and verifier.
        var privateKey = DerivePrivateKey(salt, email, passwordHashString);
        var verifier = client.DeriveVerifier(privateKey);

        return new SrpSignup(email, salt, privateKey, verifier);
    }

    /// <summary>
    /// Derive a private key for a user.
    /// </summary>
    /// <param name="salt">Salt.</param>
    /// <param name="email">Email.</param>
    /// <param name="passwordHashString">Hashed password string.</param>
    /// <returns>Private key as string.</returns>
    public static string DerivePrivateKey(string salt, string email, string passwordHashString)
    {
        var client = new SrpClient();
        return client.DerivePrivateKey(salt, email, passwordHashString);
    }

    /// <summary>
    /// Generate an ephemeral value for the client.
    /// </summary>
    /// <returns>Ephemeral as string.</returns>
    public static SrpEphemeral GenerateEphemeralClient()
    {
        var client = new SrpClient();
        return client.GenerateEphemeral();
    }

    /// <summary>
    /// Generate an ephemeral value for the client.
    /// </summary>
    /// <param name="verifier">Verifier.</param>
    /// <returns>Ephemeral as string.</returns>
    public static SrpEphemeral GenerateEphemeralServer(string verifier)
    {
        var server = new SrpServer();
        return server.GenerateEphemeral(verifier);
    }

    /// <summary>
    /// Derive a shared session key on the client side.
    /// </summary>
    /// <param name="privateKey">Password hash.</param>
    /// <param name="clientSecretEphemeral">Client ephemeral secret.</param>
    /// <param name="serverEphemeralPublic">Server public ephemeral.</param>
    /// <param name="salt">Salt.</param>
    /// <param name="email">Email.</param>
    /// <returns>session.</returns>
    public static SrpSession DeriveSessionClient(string privateKey, string clientSecretEphemeral, string serverEphemeralPublic, string salt, string email)
    {
        var client = new SrpClient();
        return client.DeriveSession(
            clientSecretEphemeral,
            serverEphemeralPublic,
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
