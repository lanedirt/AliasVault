package net.aliasvault.app.vaultstore.interfaces

/**
 * Interface for operations that need callbacks.
 */
interface CryptoOperationCallback {
    /**
     * Called when the operation is successful.
     * @param result The result of the operation
     */
    fun onSuccess(result: String)

    /**
     * Called when the operation fails.
     * @param e The exception that occurred
     */
    fun onError(e: Exception)
}
