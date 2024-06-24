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

        return btoa(String.fromCharCode.apply(null, combined));
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
