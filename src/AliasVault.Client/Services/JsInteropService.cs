//-----------------------------------------------------------------------
// <copyright file="JsInteropService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.JSInterop;

/// <summary>
/// JavaScript interop service for calling JavaScript functions from C#.
/// </summary>
/// <param name="jsRuntime">IJSRuntime.</param>
public sealed class JsInteropService(IJSRuntime jsRuntime)
{
    /// <summary>
    /// Symmetrically encrypts a string using the provided encryption key.
    /// </summary>
    /// <param name="plaintext">Plain text to encrypt.</param>
    /// <param name="encryptionKey">Encryption key to use.</param>
    /// <returns>Encrypted ciphertext.</returns>
    public async Task<string> SymmetricEncrypt(string plaintext, string encryptionKey)
    {
        if (string.IsNullOrEmpty(plaintext))
        {
            return plaintext;
        }

        return await jsRuntime.InvokeAsync<string>("cryptoInterop.encrypt", plaintext, encryptionKey);
    }

    /// <summary>
    /// Symmetrically decrypts a string using the provided encryption key.
    /// </summary>
    /// <param name="ciphertext">Cipher text to decrypt.</param>
    /// <param name="encryptionKey">Encryption key to use.</param>
    /// <returns>Encrypted ciphertext.</returns>
    public async Task<string> SymmetricDecrypt(string ciphertext, string encryptionKey)
    {
        if (string.IsNullOrEmpty(ciphertext))
        {
            return ciphertext;
        }

        return await jsRuntime.InvokeAsync<string>("cryptoInterop.decrypt", ciphertext, encryptionKey);
    }

    /// <summary>
    /// Downloads a file from a stream.
    /// </summary>
    /// <param name="filename">Filename of the download.</param>
    /// <param name="blob">Blob byte array to download.</param>
    /// <returns>Task.</returns>
    public async Task DownloadFileFromStream(string filename, byte[] blob) =>
        await jsRuntime.InvokeVoidAsync("downloadFileFromStream", filename, blob);

    /// <summary>
    /// Focus an element by its ID.
    /// </summary>
    /// <param name="elementId">The element ID to focus.</param>
    /// <returns>Task.</returns>
    public async Task FocusElementById(string elementId) =>
        await jsRuntime.InvokeVoidAsync("focusElement", elementId);

    /// <summary>
    /// Blur (defocus) an element by its ID.
    /// </summary>
    /// <param name="elementId">The element ID to focus.</param>
    /// <returns>Task.</returns>
    public async Task BlurElementById(string elementId) =>
        await jsRuntime.InvokeVoidAsync("blurElement", elementId);

    /// <summary>
    /// Copy a string to the browser's clipboard.
    /// </summary>
    /// <param name="value">Value to copy to clipboard.</param>
    /// <returns>Task.</returns>
    public async Task CopyToClipboard(string value) =>
        await jsRuntime.InvokeVoidAsync("navigator.clipboard.writeText", value);

    /// <summary>
    /// Initializes the top menu.
    /// </summary>
    /// <returns>Task.</returns>
    public async Task InitTopMenu() =>
        await jsRuntime.InvokeVoidAsync("window.initTopMenu");

    /// <summary>
    /// Registers a click outside handler for the top menu.
    /// </summary>
    /// <typeparam name="TComponent">Component type.</typeparam>
    /// <param name="objRef">DotNetObjectReference.</param>
    /// <returns>Task.</returns>
    public async Task TopMenuClickOutsideHandler<TComponent>(DotNetObjectReference<TComponent> objRef)
        where TComponent : class =>
        await jsRuntime.InvokeVoidAsync("window.topMenuClickOutsideHandler", objRef);

    /// <summary>
    /// Generates a new RSA key pair.
    /// </summary>
    /// <returns>Tuple with public and private key.</returns>
    public async Task<(string PublicKey, string PrivateKey)> GenerateRsaKeyPair()
    {
        var result = await jsRuntime.InvokeAsync<JsonElement>("rsaInterop.generateRsaKeyPair");
        return (result.GetProperty("publicKey").GetString()!, result.GetProperty("privateKey").GetString()!);
    }

    /// <summary>
    /// Encrypts a plaintext with a public key.
    /// </summary>
    /// <param name="plaintext">Plain text to encrypt.</param>
    /// <param name="publicKey">Public key to use for encryption.</param>
    /// <returns>Encrypted ciphertext.</returns>
    public async Task<string> EncryptWithPublicKey(string plaintext, string publicKey) =>
        await jsRuntime.InvokeAsync<string>("rsaInterop.encryptWithPublicKey", plaintext, publicKey);

    /// <summary>
    /// Decrypts a ciphertext with a private key.
    /// </summary>
    /// <param name="base64Ciphertext">Ciphertext to decrypt.</param>
    /// <param name="privateKey">Private key to use for decryption.</param>
    /// <returns>Decrypted string.</returns>
    public async Task<byte[]> DecryptWithPrivateKey(string base64Ciphertext, string privateKey)
    {
        try
        {
            // Invoke the JavaScript function and get the result as a byte array
            byte[] result = await jsRuntime.InvokeAsync<byte[]>("rsaInterop.decryptWithPrivateKey", base64Ciphertext, privateKey);
            return result;
        }
        catch (JSException ex)
        {
            await Console.Error.WriteLineAsync($"JavaScript decryption error: {ex.Message}");
            throw new CryptographicException("Decryption failed", ex);
        }
    }

    /// <summary>
    /// Generates a QR code.
    /// </summary>
    /// <param name="elementId">Element ID that contains data-url attribute which to generate QR code for.</param>
    /// <returns>Task.</returns>
    public async Task GenerateQrCode(string elementId)
    {
        try
        {
            // Invoke the JavaScript function and get the result as a byte array
            await jsRuntime.InvokeVoidAsync("generateQrCode", "authenticator-uri");
        }
        catch (JSException ex)
        {
            await Console.Error.WriteLineAsync($"JavaScript error: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets the WebAuthn credential derived key used to encrypt or decrypt the persisted vault encryption key.
    /// </summary>
    /// <param name="credentialId">The credential ID to use.</param>
    /// <param name="salt">The salt to use.</param>
    /// <returns>Derived key as base64 string.</returns>
    /// <exception cref="NotSupportedException">Thrown when the authenticator does not support the PRF extension.</exception>
    /// <exception cref="InvalidOperationException">Thrown when the PRF key derivation fails.</exception>
    /// <exception cref="CryptographicException">Thrown when there's an error getting the WebAuthn credential or when decryption fails.</exception>
    public async Task<string> GetWebAuthnCredentialDerivedKey(string credentialId, string salt)
    {
        try
        {
            var result = await jsRuntime.InvokeAsync<WebAuthnGetCredentialResult>("getWebAuthnCredentialAndDeriveKey", credentialId, salt);

            if (result.Error is null)
            {
                return result.DerivedKey ?? throw new CryptographicException("Derived key is null");
            }

            throw result.Error switch
            {
                "PRF_NOT_SUPPORTED" => new NotSupportedException("Authenticator does not support the PRF extension."),
                "PRF_DERIVATION_FAILED" => new InvalidOperationException("Failed to derive key using PRF extension."),
                "WEBAUTHN_CREATE_ERROR" => new CryptographicException($"Failed to create WebAuthn credential: {result.Message}"),
                _ => new CryptographicException($"Unknown error occurred: {result.Error ?? "No error specified"}"),
            };
        }
        catch (JSException ex)
        {
            await Console.Error.WriteLineAsync($"JavaScript error: {ex.Message}");
            throw new CryptographicException("Decryption failed", ex);
        }
    }

    /// <summary>
    /// Gets or creates the WebAuthn credential derived key used to encrypt or decrypt the persisted vault encryption key.
    /// </summary>
    /// <param name="username">The username for the credential.</param>
    /// <returns>A tuple containing the credential ID, salt and the derived key.</returns>
    /// <exception cref="CryptographicException">Thrown when decryption fails due to a JavaScript error.</exception>
    /// <exception cref="NotSupportedException">Thrown when the authenticator does not support the PRF extension.</exception>
    /// <exception cref="InvalidOperationException">Thrown when the PRF key derivation fails.</exception>
    public async Task<(string CredentialId, string Salt, string DerivedKey)> CreateWebAuthnCredentialDerivedKey(string username)
    {
        try
        {
            var result = await jsRuntime.InvokeAsync<WebAuthnCreateCredentialResult>("createWebAuthnCredentialAndDeriveKey", "AliasVault | " + username);

            if (result.CredentialId is not null &&
                result.Salt is not null &&
                result.DerivedKey is not null)
            {
                return (result.CredentialId, result.Salt, result.DerivedKey);
            }

            throw result.Error switch
            {
                "PRF_NOT_SUPPORTED" => new NotSupportedException("Authenticator does not support the PRF extension."),
                "PRF_DERIVATION_FAILED" => new InvalidOperationException("Failed to derive key using PRF extension."),
                "WEBAUTHN_CREATE_ERROR" => new CryptographicException($"Failed to create WebAuthn credential: {result.Message}"),
                _ => new CryptographicException($"Unknown error occurred: {result.Error ?? "No error specified"}"),
            };
        }
        catch (JSException ex)
        {
            await Console.Error.WriteLineAsync($"JavaScript error: {ex.Message}");
            throw new CryptographicException("Decryption failed", ex);
        }
    }

    /// <summary>
    /// Represents the result of a WebAuthn get credential operation.
    /// </summary>
    private sealed class WebAuthnGetCredentialResult
    {
        /// <summary>
        /// Gets the derived key.
        /// </summary>
        public string? DerivedKey { get; }

        /// <summary>
        /// Gets the optional error message.
        /// </summary>
        public string? Error { get; }

        /// <summary>
        /// Gets the optional additional error details.
        /// </summary>
        public string? Message { get; }
    }

    /// <summary>
    /// Represents the result of a WebAuthn credential operation.
    /// </summary>
    private sealed class WebAuthnCreateCredentialResult
    {
        /// <summary>
        /// Gets the credential ID as a base64 string.
        /// </summary>
        public string? CredentialId { get; }

        /// <summary>
        /// Gets the salt as a base64 string.
        /// </summary>
        public string? Salt { get; }

        /// <summary>
        /// Gets the derived key as a base64 string.
        /// </summary>
        public string? DerivedKey { get; }

        /// <summary>
        /// Gets the optional error message.
        /// </summary>
        public string? Error { get; }

        /// <summary>
        /// Gets the optional additional error details.
        /// </summary>
        public string? Message { get; }
    }
}
