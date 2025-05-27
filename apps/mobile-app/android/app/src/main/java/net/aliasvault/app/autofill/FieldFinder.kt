package net.aliasvault.app.autofill

import android.app.assist.AssistStructure
import android.view.View
import android.view.autofill.AutofillId
import net.aliasvault.app.autofill.models.FieldType

/**
 * Helper class to find fields in the assist structure.
 */
class FieldFinder(var structure: AssistStructure) {
    // Store pairs of (AutofillId, net.aliasvault.app.autofill.models.FieldType)
    val autofillableFields = mutableListOf<Pair<AutofillId, FieldType>>()
    var foundPasswordField = false
    var foundUsernameField = false
    var lastField: AutofillId? = null

    fun parseStructure() {
        val nodeCount = structure.windowNodeCount
        for (i in 0 until nodeCount) {
            val windowNode = structure.getWindowNodeAt(i)
            val rootNode = windowNode.rootViewNode
            parseNode(rootNode)
        }
    }

    /**
     * Determines if a field is most likely an email field, username field, password field, or unknown.
     */
    fun determineFieldType(fieldId: AutofillId): FieldType {
        // Find the node in the structure
        val node = findNodeById(fieldId) ?: return FieldType.UNKNOWN

        // Check for password field first
        if (isLikelyPasswordField(node)) {
            return FieldType.PASSWORD
        }

        // Check for email-specific indicators
        if (isEmailField(node)) {
            return FieldType.EMAIL
        }

        // Check for username-specific indicators
        if (isUsernameField(node)) {
            return FieldType.USERNAME
        }

        return FieldType.UNKNOWN
    }

    private fun parseNode(node: AssistStructure.ViewNode) {
        val viewId = node.autofillId

        // Consider any editable field as a potential field
        if (viewId != null && isEditableField(node)) {
            val fieldType = determineFieldType(viewId)

            if (fieldType == FieldType.PASSWORD) {
                foundPasswordField = true
                autofillableFields.add(Pair(viewId, fieldType))
            } else if (fieldType == FieldType.USERNAME || fieldType == FieldType.EMAIL) {
                foundUsernameField = true
                autofillableFields.add(Pair(viewId, fieldType))
            } else {
                // Store the last field we saw in case we need it for username detection
                lastField = viewId
            }
        }

        // Recursively parse child nodes
        val childCount = node.childCount
        for (i in 0 until childCount) {
            parseNode(node.getChildAt(i))
        }
    }

    private fun isEmailField(node: AssistStructure.ViewNode): Boolean {
        // Check input type for email
        if ((node.inputType and android.text.InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS) != 0) {
            return true
        }

        // Check autofill hints
        val hints = node.autofillHints
        if (hints != null) {
            for (hint in hints) {
                if (hint.contains("email", ignoreCase = true)) {
                    return true
                }
            }
        }

        // Check HTML attributes
        val htmlInfo = node.htmlInfo
        if (htmlInfo != null) {
            val attributes = htmlInfo.attributes
            if (attributes != null) {
                for (i in 0 until attributes.size) {
                    val name = attributes.get(i)?.first
                    val value = attributes.get(i)?.second
                    if (name == "type" && value == "email") {
                        return true
                    }
                    if (name == "name" && value?.contains("email", ignoreCase = true) == true) {
                        return true
                    }
                }
            }
        }

        // Check ID and hint text
        val idEntry = node.idEntry
        val hint = node.hint
        if (idEntry?.contains("email", ignoreCase = true) == true ||
            hint?.contains("email", ignoreCase = true) == true) {
            return true
        }

        return false
    }

    private fun isUsernameField(node: AssistStructure.ViewNode): Boolean {
        // Check autofill hints
        val hints = node.autofillHints
        if (hints != null) {
            for (hint in hints) {
                if (hint == View.AUTOFILL_HINT_USERNAME ||
                    hint.contains("username", ignoreCase = true)) {
                    return true
                }
            }
        }

        // Check HTML attributes
        val htmlInfo = node.htmlInfo
        if (htmlInfo != null) {
            val attributes = htmlInfo.attributes
            if (attributes != null) {
                for (i in 0 until attributes.size) {
                    val name = attributes.get(i)?.first
                    val value = attributes.get(i)?.second
                    if (name == "name" && (value == "username" || value == "user")) {
                        return true
                    }
                }
            }
        }

        // Check ID and hint text
        val idEntry = node.idEntry
        val hint = node.hint
        if (idEntry?.contains("username", ignoreCase = true) == true ||
            idEntry?.contains("user", ignoreCase = true) == true ||
            hint?.contains("username", ignoreCase = true) == true ||
            hint?.contains("user", ignoreCase = true) == true) {
            return true
        }

        return false
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
        val inputType = node.inputType
        val isPasswordType = (inputType and android.text.InputType.TYPE_MASK_CLASS == android.text.InputType.TYPE_CLASS_TEXT &&
            (inputType and android.text.InputType.TYPE_MASK_VARIATION == android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD ||
                inputType and android.text.InputType.TYPE_MASK_VARIATION == android.text.InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD ||
                inputType and android.text.InputType.TYPE_MASK_VARIATION == android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD)) ||
            (inputType and android.text.InputType.TYPE_MASK_CLASS == android.text.InputType.TYPE_CLASS_NUMBER &&
                inputType and android.text.InputType.TYPE_MASK_VARIATION == android.text.InputType.TYPE_NUMBER_VARIATION_PASSWORD)
        if (isPasswordType) {
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

    private fun findNodeById(fieldId: AutofillId): AssistStructure.ViewNode? {
        val nodeCount = structure.windowNodeCount
        for (i in 0 until nodeCount) {
            val windowNode = structure.getWindowNodeAt(i)
            val rootNode = windowNode.rootViewNode
            val node = findNodeByIdRecursive(rootNode, fieldId)
            if (node != null) {
                return node
            }
        }
        return null
    }

    private fun findNodeByIdRecursive(node: AssistStructure.ViewNode, fieldId: AutofillId): AssistStructure.ViewNode? {
        if (node.autofillId == fieldId) {
            return node
        }
        val childCount = node.childCount
        for (i in 0 until childCount) {
            val child = node.getChildAt(i)
            val result = findNodeByIdRecursive(child, fieldId)
            if (result != null) {
                return result
            }
        }
        return null
    }
}
