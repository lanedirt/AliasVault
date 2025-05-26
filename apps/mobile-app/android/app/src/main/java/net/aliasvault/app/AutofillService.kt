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
import android.R
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
import android.service.autofill.InlinePresentation
import android.widget.inline.InlinePresentationSpec
import android.app.slice.Slice
import android.app.slice.SliceSpec
import android.net.Uri
import android.graphics.drawable.Icon
import android.app.PendingIntent
import android.content.Context
import net.aliasvault.app.vaultstore.VaultStore
import net.aliasvault.app.vaultstore.VaultStore.CredentialOperationCallback
import net.aliasvault.app.vaultstore.models.Credential
import androidx.core.net.toUri

class AutofillService : AutofillService() {
    private val TAG = "AliasVaultAutofill"

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
        parseStructure(structure, fieldFinder)

        // If no password field was found, return an empty response
        if (!fieldFinder.foundPasswordField) {
            Log.d(TAG, "No password field found, skipping autofill")
            callback.onSuccess(null)
            return
        }

        // If we found a password field but no username field, and we have a last field,
        // assume it's the username field
        if (fieldFinder.lastUsernameField == null && fieldFinder.lastField != null) {
            fieldFinder.autofillableFields.add(Pair(fieldFinder.lastField!!, false))
            Log.d(TAG, "Using last field as username field: ${fieldFinder.lastField}")
        }

        // Handle inline suggestions request if present
        val inlineRequest = request.inlineSuggestionsRequest
        if (inlineRequest != null) {
            Log.d(TAG, "Inline suggestions request received!")
            handleInlineSuggestionsRequest(inlineRequest, callback, fieldFinder)
            return
        }

        // If no inline request, proceed with regular autofill
        launchActivityForAutofill(fieldFinder, callback)
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        // In a full implementation, you would:
        // 1. Extract the username/password from the SaveRequest
        // 2. Launch an activity to let the user confirm saving
        // 3. Save the credential using the SharedCredentialStore

        // For now, just acknowledge the request
        callback.onSuccess()
    }

    private fun launchActivityForAutofill(fieldFinder: FieldFinder, callback: FillCallback) {
        Log.d(TAG, "Launching activity for autofill authentication")

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

                        // Create a response with all credentials
                        val responseBuilder = FillResponse.Builder()

                        // Add each credential as a dataset
                        for (credential in result) {
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

    // Helper method to create a dataset from a credential
    private fun addDatasetForCredential(
        responseBuilder: FillResponse.Builder,
        fieldFinder: FieldFinder,
        credential: Credential
    ) {
        // Create presentation for this credential
        val presentation = RemoteViews(packageName, R.layout.simple_list_item_1)
        presentation.setTextViewText(
            R.id.text1,
            "${credential.username} (${credential.service.name})"
        )

        // Create inline presentation spec
        val inlinePresentationSpec = InlinePresentationSpec.Builder(
            android.util.Size(0, 0),  // minSize
            android.util.Size(500, 100)  // maxSize
        ).build()

        // Create a Slice for the inline presentation
        val sliceUri = "content://${packageName}/autofill/${credential.id}".toUri()
        val slice = Slice.Builder(sliceUri, SliceSpec("autofill", 1))
            .addText("${credential.username} (${credential.service.name})", null, listOf("title"))
            .build()

        // Create inline presentation with the Slice
        val inlinePresentation = InlinePresentation(
            slice,
            inlinePresentationSpec,
            false // isPinned
        )

        val dataSetBuilder = Dataset.Builder(presentation)

        // Add autofill values for all fields
        for (field in fieldFinder.autofillableFields) {
            val isPassword = field.second
            if (isPassword) {
                if (credential.password != null) {
                    dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.password.value as CharSequence))
                    // Add inline presentation for password field
                    dataSetBuilder.setInlinePresentation(inlinePresentation)
                }
            } else {
                if (credential.username != null) {
                    dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.username))
                    // Add inline presentation for username field
                    dataSetBuilder.setInlinePresentation(inlinePresentation)
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

    private fun handleInlineSuggestionsRequest(
        inlineRequest: android.view.inputmethod.InlineSuggestionsRequest,
        callback: FillCallback,
        fieldFinder: FieldFinder
    ) {
        // Get the maximum number of suggestions requested
        val maxSuggestions = inlineRequest.maxSuggestionCount

        // Get the inline presentation specs
        val specs = inlineRequest.inlinePresentationSpecs

        if (specs.isEmpty()) {
            Log.d(TAG, "No inline presentation specs provided")
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

                        // Create a response with credentials
                        val responseBuilder = FillResponse.Builder()

                        // Add each credential as a dataset, up to max suggestions
                        for (i in 0 until minOf(result.size, maxSuggestions)) {
                            val credential = result[i]
                            val spec = specs[i % specs.size] // Cycle through available specs

                            // Create inline presentation for this credential
                            val inlinePresentation = createInlinePresentation(credential, spec)

                            // Create dataset with inline presentation
                            val datasetBuilder = Dataset.Builder()
                                .setInlinePresentation(inlinePresentation)

                            // Add the credential data to all detected fields
                            for (field in fieldFinder.autofillableFields) {
                                val isPassword = field.second
                                val value = if (isPassword) {
                                    credential.password?.value as? CharSequence ?: ""
                                } else {
                                    credential.username ?: ""
                                }
                                datasetBuilder.setValue(
                                    field.first,
                                    AutofillValue.forText(value),
                                )
                            }

                            // Add this dataset to the response
                            responseBuilder.addDataset(datasetBuilder.build())
                        }

                        // Send the response back
                        callback.onSuccess(responseBuilder.build())

                    } catch (e: Exception) {
                        Log.e(TAG, "Error creating inline suggestions", e)
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
        Log.d(TAG, "No unlocked vault available for inline suggestions")
        callback.onSuccess(null)
    }

    private fun createInlinePresentation(
        credential: Credential,
        spec: android.widget.inline.InlinePresentationSpec
    ): InlinePresentation {
        // Create a Slice for the inline presentation
        val sliceUri = "content://${packageName}/autofill/${credential.id}".toUri()
        val slice = Slice.Builder(sliceUri, SliceSpec("autofill", 1))
            .addText("${credential.username} (${credential.service.name})", null, listOf("title"))
            .build()

        // Create inline presentation with the Slice
        return InlinePresentation(
            slice,
            spec,
            false // isPinned
        )
    }

    private class FieldFinder {
        // Store pairs of (AutofillId, isPasswordField)
        val autofillableFields = mutableListOf<Pair<AutofillId, Boolean>>()
        var foundPasswordField = false
        var lastUsernameField: AutofillId? = null
        var lastField: AutofillId? = null
    }

    companion object {
        private const val TAG = "AliasVaultAutofill"
    }
}
