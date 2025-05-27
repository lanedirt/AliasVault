/**
 * AliasVault Autofill Service Implementation
 *
 * This service implements the Android Autofill framework to provide AliasVault credentials
 * to forms. It identifies username and password fields in apps and websites,
 * then offers stored credentials from AliasVault.
 *
 * IMPORTANT IMPLEMENTATION NOTES:
 * 1. Since autofill services don't have direct access to activities, we need a way to
 *    authenticate the user. The current implementation:
 *     - Shows a Toast indicating authentication is needed
 *     - In a real implementation, would launch an activity for authentication
 *
 * 2. To complete this implementation, you need to:
 *     - Register this service in AndroidManifest.xml with proper metadata
 *     - Add a way to communicate between the launched activity and this service
 *     - Implement credential storage/retrieval with proper authentication
 *
 * 3. For full production implementation, consider:
 *     - Adding a specific autofill activity for authentication
 *     - Implementing dataset presentation customization
 *     - Adding support for save functionality
 *     - Implementing field detection heuristics for apps without autofill hints
 */
package net.aliasvault.app
import android.app.assist.AssistStructure
import android.content.Intent
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.Dataset
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.SaveCallback
import android.service.autofill.SaveRequest
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import net.aliasvault.app.vaultstore.VaultStore
import net.aliasvault.app.vaultstore.VaultStore.CredentialOperationCallback
import net.aliasvault.app.vaultstore.models.Credential
import net.aliasvault.app.autofill.CredentialMatcher
import androidx.core.net.toUri

class AutofillService : AutofillService() {
    private val TAG = "AliasVaultAutofill"
    private val credentialMatcher = CredentialMatcher()

    override fun onFillRequest(
        request: FillRequest,
        cancellationSignal: CancellationSignal,
        callback: FillCallback
    ) {
        Log.d(TAG, "onFillRequest called")

        // Check if request was cancelled
        if (cancellationSignal.isCanceled) {
            return
        }

        // Get the autofill contexts for this request
        val contexts = request.fillContexts
        val context = contexts.last()
        val structure = context.structure

        // Find any autofillable fields in the form
        val fieldFinder = FieldFinder()
        fieldFinder.structure = structure
        parseStructure(structure, fieldFinder)

        // If no password field was found, return an empty response
        /*if (!fieldFinder.foundPasswordField) {
            Log.d(TAG, "No password field found, skipping autofill")
            callback.onSuccess(null)
            return
        }*/

        // If we found a password field but no username field, and we have a last field,
        // assume it's the username field
        if (fieldFinder.lastUsernameField == null && fieldFinder.lastField != null) {
            fieldFinder.autofillableFields.add(Pair(fieldFinder.lastField!!, false))
            Log.d(TAG, "Using last field as username field: ${fieldFinder.lastField}")
        }

        launchActivityForAutofill(fieldFinder, callback)
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        // In a full implementation, you would:
        // 1. Extract the username/password from the SaveRequest
        // 2. Launch an activity to let the user confirm saving
        // 3. Save the credential using the VaultStore

        // For now, just acknowledge the request
        callback.onSuccess()
    }

    private fun launchActivityForAutofill(fieldFinder: FieldFinder, callback: FillCallback) {
        Log.d(TAG, "Launching activity for autofill authentication")

        // Get the app/website information from the structure
        val appInfo = getAppInfo(fieldFinder.structure)
        Log.d(TAG, "Autofill request from: $appInfo")

        // Ignore requests from our own unlock page as this would cause a loop
        if (appInfo == "net.aliasvault.app") {
            Log.d(TAG, "Skipping autofill request from AliasVault app itself")
            callback.onSuccess(null)
            return
        }

        // First try to get an existing instance
        val store = VaultStore.getExistingInstance()

        if (store != null) {
            // We have an existing instance, try to get credentials
            if (store.tryGetAllCredentials(object : CredentialOperationCallback {
                    override fun onSuccess(result: List<Credential>) {
                        try {
                            Log.d(TAG, "Retrieved ${result.size} credentials")
                            if (result.size == 0) {
                                // No credentials available
                                Log.d(TAG, "No credentials available")
                                callback.onSuccess(null)
                                return
                            }

                            // Filter credentials based on app/website info
                            val filteredCredentials = if (appInfo != null) {
                                filterCredentialsByAppInfo(result, appInfo)
                            } else {
                                result
                            }

                            Log.d(TAG, "Amount of credentials filtered with this app info: ${filteredCredentials.size}")

                            // If there are no results, disable autofill.
                            if (filteredCredentials.size == 0) {
                                Log.d(TAG, "No credentials found for this app, disabling autofill")
                                callback.onSuccess(null)
                                return
                            }

                            // Create a response with filtered credentials
                            val responseBuilder = FillResponse.Builder()

                            // Add each credential as a dataset
                            for (credential in filteredCredentials) {
                                // Create a dataset for this credential
                                addDatasetForCredential(responseBuilder, fieldFinder, credential)
                            }

                            // Send the response back
                            callback.onSuccess(responseBuilder.build())

                        } catch (e: Exception) {
                            Log.e(TAG, "Error parsing credentials", e)
                            callback.onSuccess(null)
                        }
                    }

                    override fun onError(e: Exception) {
                        Log.e(TAG, "Error getting credentials", e)
                        callback.onSuccess(null)
                    }
                })) {
                // Successfully used cached key - method returns true
                Log.d(TAG, "Successfully retrieved credentials with unlocked vault")
                return
            }
        }

        // If we get here, either there was no instance or the vault wasn't unlocked
        // Launch the AliasVault app in order to load the encryption key from biometric keystore
        Log.d(TAG, "No unlocked vault available, launching activity for authentication")

        // Create an intent to launch MainActivity with autofill flags
        val intent = Intent(this, MainActivity::class.java).apply {
            // Add flags to launch as a new task
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            // Add extra data to indicate this is for autofill
            putExtra("AUTOFILL_REQUEST", true)
        }

        // Start the activity
        startActivity(intent)
    }

    private fun getAppInfo(structure: AssistStructure?): String? {
        if (structure == null) {
            return null
        }

        // First check if this is web content
        val nodeCount = structure.windowNodeCount
        for (i in 0 until nodeCount) {
            val windowNode = structure.getWindowNodeAt(i)
            val rootNode = windowNode.rootViewNode

            // Check for web-specific information
            val webInfo = findWebInfoInNode(rootNode)
            if (webInfo != null) {
                Log.d(TAG, "Found web info: $webInfo")
                return webInfo
            }
        }

        // If no web info found, fall back to package name
        val packageName = structure.activityComponent?.packageName
        if (packageName != null) {
            Log.d(TAG, "Using package name: $packageName")
            return packageName
        }

        return null
    }

    private fun findWebInfoInNode(node: AssistStructure.ViewNode): String? {
        // Check for web domain
        val webDomain = node.webDomain
        val webScheme = node.webScheme
        if (webDomain != null && webScheme != null) {
            return "$webScheme://$webDomain"
        }

        // Check for web URL
        val webUrl = node.webDomain
        if (webUrl != null) {
            try {
                val uri = webUrl.toUri()
                val host = uri.host
                if (host != null) {
                    return host
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing web URL: $webUrl", e)
            }
        }

        // Check HTML info for domain or URL
        val htmlInfo = node.htmlInfo
        if (htmlInfo != null) {
            val attributes = htmlInfo.attributes
            if (attributes != null) {
                for (i in 0 until attributes.size) {
                    val name = attributes.get(i)?.first
                    val value = attributes.get(i)?.second
                    if (name == "domain" || name == "host" || name == "url") {
                        return value
                    }
                }
            }
        }

        // Check for web-specific hints
        val hints = node.autofillHints
        if (hints != null) {
            for (hint in hints) {
                if (hint.contains("web", ignoreCase = true) ||
                    hint.contains("url", ignoreCase = true) ||
                    hint.contains("domain", ignoreCase = true)) {
                    return hint
                }
            }
        }

        // Recursively check child nodes
        val childCount = node.childCount
        for (i in 0 until childCount) {
            val webInfo = findWebInfoInNode(node.getChildAt(i))
            if (webInfo != null) {
                return webInfo
            }
        }

        return null
    }

    // Helper method to create a dataset from a credential
    private fun addDatasetForCredential(
        responseBuilder: FillResponse.Builder,
        fieldFinder: FieldFinder,
        credential: Credential
    ) {
        // Create presentation for this credential
        val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1)
        presentation.setTextViewText(
            android.R.id.text1,
            "${credential.username} (${credential.service.name})"
        )

        val dataSetBuilder = Dataset.Builder(presentation)

        // Add autofill values for all fields
        for (field in fieldFinder.autofillableFields) {
            val isPassword = field.second
            if (isPassword) {
                if (credential.password != null) {
                    dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.password.value as CharSequence))
                }
            } else {
                if (credential.username != null) {
                    dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.username))
                }
            }
        }

        // Add this dataset to the response
        responseBuilder.addDataset(dataSetBuilder.build())
    }

    private fun parseStructure(structure: AssistStructure, fieldFinder: FieldFinder) {
        val nodeCount = structure.windowNodeCount
        for (i in 0 until nodeCount) {
            val windowNode = structure.getWindowNodeAt(i)
            val rootNode = windowNode.rootViewNode
            parseNode(rootNode, fieldFinder)
        }
    }

    private fun parseNode(node: AssistStructure.ViewNode, fieldFinder: FieldFinder) {
        val viewId = node.autofillId

        // Consider any editable field as a potential field
        if (viewId != null && isEditableField(node)) {
            // Check if it's likely a password field
            val isPasswordField = isLikelyPasswordField(node)

            if (isPasswordField) {
                fieldFinder.foundPasswordField = true
                fieldFinder.autofillableFields.add(Pair(viewId, true))
                Log.d(TAG, "Found password field: $viewId")
            } else {
                // For non-password fields, check if it might be a username field
                if (isLikelyUsernameField(node)) {
                    fieldFinder.lastUsernameField = viewId
                    fieldFinder.autofillableFields.add(Pair(viewId, false))
                    Log.d(TAG, "Found username field: $viewId")
                } else {
                    // Store the last field we saw in case we need it for username detection
                    fieldFinder.lastField = viewId
                }
            }
        }

        // Recursively parse child nodes
        val childCount = node.childCount
        for (i in 0 until childCount) {
            parseNode(node.getChildAt(i), fieldFinder)
        }
    }

    private fun isEditableField(node: AssistStructure.ViewNode): Boolean {
        // Check if the node is editable in any way
        return node.inputType > 0 ||
            node.className?.contains("EditText") == true ||
            node.className?.contains("Input") == true ||
            node.htmlInfo?.tag?.equals("input", ignoreCase = true) == true
    }

    private fun isLikelyPasswordField(node: AssistStructure.ViewNode): Boolean {
        // Try to determine if this is a password field
        val hints = node.autofillHints
        if (hints != null) {
            for (hint in hints) {
                if (hint == View.AUTOFILL_HINT_PASSWORD || hint.contains("password", ignoreCase = true)) {
                    return true
                }
            }
        }

        // Check by input type
        if ((node.inputType and android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD) != 0 ||
            (node.inputType and android.text.InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD) != 0) {
            return true
        }

        // Check by ID or text
        val idEntry = node.idEntry
        if (idEntry != null && idEntry.contains("pass", ignoreCase = true)) {
            return true
        }

        // Check by HTML attributes
        val htmlInfo = node.htmlInfo
        if (htmlInfo != null) {
            val attributes = htmlInfo.attributes
            if (attributes != null) {
                for (i in 0 until attributes.size) {
                    val name = attributes.get(i)?.first
                    val value = attributes.get(i)?.second
                    if (name == "type" && value == "password") {
                        return true
                    }
                }
            }
        }

        return false
    }

    private fun isLikelyUsernameField(node: AssistStructure.ViewNode): Boolean {
        // Check autofill hints
        val hints = node.autofillHints
        if (hints != null) {
            for (hint in hints) {
                if (hint == View.AUTOFILL_HINT_USERNAME ||
                    hint.contains("username", ignoreCase = true) ||
                    hint.contains("email", ignoreCase = true)) {
                    return true
                }
            }
        }

        // Check by ID or text
        val idEntry = node.idEntry
        if (idEntry != null) {
            val lowerId = idEntry.lowercase()
            if (lowerId.contains("username") ||
                lowerId.contains("email") ||
                lowerId.contains("login") ||
                lowerId.contains("user")) {
                return true
            }
        }

        // Check by HTML attributes
        val htmlInfo = node.htmlInfo
        if (htmlInfo != null) {
            val attributes = htmlInfo.attributes
            if (attributes != null) {
                for (i in 0 until attributes.size) {
                    val name = attributes.get(i)?.first
                    val value = attributes.get(i)?.second
                    if (name == "type" && (value == "text" || value == "email")) {
                        // Check if there's a label or placeholder that suggests username
                        val label = node.hint
                        if (label != null && (
                                label.contains("username", ignoreCase = true) ||
                                    label.contains("email", ignoreCase = true) ||
                                    label.contains("login", ignoreCase = true) ||
                                    label.contains("user", ignoreCase = true)
                                )) {
                            return true
                        }
                    }
                }
            }
        }

        return false
    }

    private fun filterCredentialsByAppInfo(credentials: List<Credential>, appInfo: String): List<Credential> {
        return credentialMatcher.filterCredentialsByAppInfo(credentials, appInfo)
    }

    private class FieldFinder {
        // Store pairs of (AutofillId, isPasswordField)
        val autofillableFields = mutableListOf<Pair<AutofillId, Boolean>>()
        var foundPasswordField = false
        var lastUsernameField: AutofillId? = null
        var lastField: AutofillId? = null
        var structure: AssistStructure? = null
    }

    companion object {
        private const val TAG = "AliasVaultAutofill"
    }
}
