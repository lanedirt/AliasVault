/**
 * AES (symmetric) encryption and decryption functions.
 * @type {{encrypt: (function(*, *): Promise<string>), decrypt: (function(*, *): Promise<string>)}}
 */
window.cryptoInterop = {
    encrypt: async function (plaintext, base64Key) {
        const key = await window.crypto.subtle.importKey(
            "raw",
            Uint8Array.from(atob(base64Key), c => c.charCodeAt(0)),
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encoded = encoder.encode(plaintext);

        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encoded
        );

        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return btoa(
            Array.from(combined)
                .map(byte => String.fromCharCode(byte))
                .join('')
        );
    },
    decrypt: async function (base64Ciphertext, base64Key) {
        const key = await window.crypto.subtle.importKey(
            "raw",
            Uint8Array.from(atob(base64Key), c => c.charCodeAt(0)),
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        const ivAndCiphertext = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
        const iv = ivAndCiphertext.slice(0, 12);
        const ciphertext = ivAndCiphertext.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }
};

/**
 * RSA (asymmetric) encryption and decryption functions.
 * @type {{decryptWithPrivateKey: (function(string, string): Promise<string>), encryptWithPublicKey: (function(string, string): Promise<string>), generateRsaKeyPair: (function(): Promise<{privateKey: string, publicKey: string}>)}}
 */
window.rsaInterop = {
    /**
     * Generates a new RSA key pair.
     * @returns {Promise<{publicKey: string, privateKey: string}>} A promise that resolves to an object containing the public and private keys as JWK strings.
     */
    generateRsaKeyPair : async function() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

        return {
            publicKey: JSON.stringify(publicKey),
            privateKey: JSON.stringify(privateKey)
        };
    },
    /**
     * Encrypts a plaintext string using an RSA public key.
     * @param {string} plaintext - The plaintext to encrypt.
     * @param {string} publicKey - The public key in JWK format.
     * @returns {Promise<string>} A promise that resolves to the encrypted data as a base64-encoded string.
     */
    encryptWithPublicKey : async function(plaintext, publicKey) {
        const publicKeyObj = await window.crypto.subtle.importKey(
            "jwk",
            JSON.parse(publicKey),
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            false,
            ["encrypt"]
        );

        const encodedPlaintext = new TextEncoder().encode(plaintext);
        const cipherBuffer = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKeyObj,
            encodedPlaintext
        );

        return btoa(String.fromCharCode.apply(null, new Uint8Array(cipherBuffer)));
    },
    /**
     * Decrypts a ciphertext string using an RSA private key.
     * @param {string} ciphertext - The base64-encoded ciphertext to decrypt.
     * @param {string} privateKey - The private key in JWK format.
     * @returns {Promise<string>} A promise that resolves to the decrypted plaintext.
     */
    decryptWithPrivateKey : async function(ciphertext, privateKey) {
        const privateKeyObj = await window.crypto.subtle.importKey(
            "jwk",
            JSON.parse(privateKey),
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            false,
            ["decrypt"]
        );

        const cipherBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const plaintextBuffer = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKeyObj,
            cipherBuffer
        );

        return new TextDecoder().decode(plaintextBuffer);
    }
};
