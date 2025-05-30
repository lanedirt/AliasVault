package net.aliasvault.app.vaultstore.interfaces

import net.aliasvault.app.vaultstore.models.Credential

/**
 * Interface for operations that need callbacks for credentials.
 */
interface CredentialOperationCallback {
    /**
     * Called when the operation is successful.
     * @param result The result of the operation
     */
    fun onSuccess(result: List<Credential>)

    /**
     * Called when the operation fails.
     * @param e The exception that occurred
     */
    fun onError(e: Exception)
}
