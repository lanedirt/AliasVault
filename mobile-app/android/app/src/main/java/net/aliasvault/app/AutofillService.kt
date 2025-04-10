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
import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.FillCallback
import android.service.autofill.FillContext
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.SaveCallback
import android.service.autofill.SaveRequest
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.fragment.app.FragmentActivity
import net.aliasvault.app.credentialmanager.Credential
import net.aliasvault.app.credentialmanager.SharedCredentialStore
import org.json.JSONArray
import android.service.autofill.Dataset

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

        // If no fields were found, return an empty response
        if (fieldFinder.autofillableFields.isEmpty()) {
            Log.d(TAG, "No autofillable fields found")
            callback.onSuccess(null)
            return
        }

        // Since we're in a Service, we don't have direct access to a FragmentActivity
        // Option 1: Launch an activity to authenticate and then fill
        launchActivityForAutofill(fieldFinder, callback)

        // Option 2: For immediate filling without authentication (simplified for demo purposes)
        // createMockAutofillResponse(fieldFinder, callback)
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
        // In a real implementation, you would launch an activity to handle authentication
        // For now, we'll just show a toast message and return null
        Toast.makeText(applicationContext, "Authentication required for autofill", Toast.LENGTH_SHORT).show()

        // For this example, we'll use mock response to demonstrate functionality
        createMockAutofillResponse(fieldFinder, callback)

        // Example of how you might start the activity (commented out)
        /*
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("AUTOFILL_REQUEST", true)
            // Add other data as needed
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
        */
    }

    // This method demonstrates what the response would look like if we had credentials
    private fun createMockAutofillResponse(fieldFinder: FieldFinder, callback: FillCallback) {
        // Create a mock credential for demonstration
        val credential = Credential("demo@example.com", "password123", "Example Service")

        // Build a response with the credential
        val responseBuilder = FillResponse.Builder()

        // Create a dataset with the credential
        val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1)
        presentation.setTextViewText(android.R.id.text1, "AliasVault: ${credential.service}")

        val dataSetBuilder = Dataset.Builder(presentation)

        // Add autofill values for all fields - fill everything with either username or password
        // depending on if the field appears to be a password field
        for (field in fieldFinder.autofillableFields) {
            val isPassword = field.second
            val value = if (isPassword) credential.password else credential.username
            dataSetBuilder.setValue(field.first, AutofillValue.forText(value))
        }

        responseBuilder.addDataset(dataSetBuilder.build())
        callback.onSuccess(responseBuilder.build())
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

        // Consider any editable field as an autofillable field
        if (viewId != null && isEditableField(node)) {
            // Check if it's likely a password field
            val isPasswordField = isLikelyPasswordField(node)
            fieldFinder.autofillableFields.add(Pair(viewId, isPasswordField))
            Log.d(TAG, "Found autofillable field: $viewId, isPassword: $isPasswordField")
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

    private class FieldFinder {
        // Store pairs of (AutofillId, isPasswordField)
        val autofillableFields = mutableListOf<Pair<AutofillId, Boolean>>()
    }

    companion object {
        private const val TAG = "AliasVaultAutofill"
    }
}
