/**
 * AliasVault Autofill Service Implementation
 *
 * This service implements the Android Autofill framework to provide AliasVault credentials
 * to forms. It identifies username and password fields in apps and websites,
 * then offers stored credentials from AliasVault.
 *
 */
package net.aliasvault.app.autofill

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
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import net.aliasvault.app.vaultstore.VaultStore
import net.aliasvault.app.vaultstore.VaultStore.CredentialOperationCallback
import net.aliasvault.app.vaultstore.models.Credential
import android.app.PendingIntent
import net.aliasvault.app.MainActivity
import net.aliasvault.app.R
import net.aliasvault.app.autofill.utils.*
import net.aliasvault.app.autofill.models.FieldType

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
        val fieldFinder = FieldFinder(structure)
        fieldFinder.parseStructure()

        // If no password field was found, return an empty response
        if (!fieldFinder.foundPasswordField && !fieldFinder.foundUsernameField) {
            Log.d(TAG, "No password or username field found, skipping autofill")
            callback.onSuccess(null)
            return
        }

        // If we found a password field but no username field, and we have a last field,
        // assume it's the username field
        // TODO: do we actually need this part?
        if (!fieldFinder.foundUsernameField && fieldFinder.lastField != null) {
            fieldFinder.autofillableFields.add(Pair(fieldFinder.lastField!!, FieldType.USERNAME))
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

        // Get the app/website information from assist structure.
        val appInfo = fieldFinder.getAppInfo()
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
                            if (result.isEmpty()) {
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

                            val responseBuilder = FillResponse.Builder()

                            // If there are no results, return "no matches" placeholder option.
                            if (filteredCredentials.isEmpty()) {
                                Log.d(TAG, "No credentials found for this app, showing 'no matches' option")
                                responseBuilder.addDataset(createNoMatchesDataset(fieldFinder))
                            }
                            else {
                                // If there are matches, add them to the dataset
                                for (credential in filteredCredentials) {
                                    responseBuilder.addDataset(createCredentialDataset(fieldFinder, credential))
                                }
                            }

                            // Add "Open AliasVault app" as the last option
                            responseBuilder.addDataset(createOpenAppDataset(fieldFinder))
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
        // Show a "vault locked" placeholder instead of launching the activity
        Log.d(TAG, "Vault is locked, showing placeholder")

        val responseBuilder = FillResponse.Builder()
        responseBuilder.addDataset(createVaultLockedDataset(fieldFinder))
        callback.onSuccess(responseBuilder.build())
    }

    // Helper method to create a dataset from a credential
    private fun createCredentialDataset(
        fieldFinder: FieldFinder,
        credential: Credential
    ) : Dataset {
        // Choose layout based on whether we have a logo
        val layoutId = if (credential.service.logo != null) {
            R.layout.autofill_dataset_item_icon
        } else {
            R.layout.autofill_dataset_item
        }

        // Create presentation for this credential using our custom layout
        val presentation = RemoteViews(packageName, layoutId)

        val dataSetBuilder = Dataset.Builder(presentation)

        // Add autofill values for all fields
        var presentationDisplayValue = credential.service.name
        for (field in fieldFinder.autofillableFields) {
            val fieldType = field.second
            when (fieldType) {
                FieldType.PASSWORD -> {
                    if (credential.password != null) {
                        dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.password.value as CharSequence))
                    }
                }
                FieldType.EMAIL -> {
                    if (credential.alias?.email != null) {
                        dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.alias.email))
                        presentationDisplayValue = "${credential.service.name} (${credential.alias.email})"
                    } else if (credential.username != null) {
                        dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.username))
                        presentationDisplayValue = "${credential.service.name} (${credential.username})"
                    }
                }
                FieldType.USERNAME -> {
                    if (credential.username != null) {
                        dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.username))
                        presentationDisplayValue = "${credential.service.name} (${credential.username})"
                    } else if (credential.alias?.email != null) {
                        dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.alias.email))
                        presentationDisplayValue = "${credential.service.name} (${credential.alias.email})"
                    }
                }
                else -> {
                    // For unknown field types, try both email and username
                    if (credential.alias?.email != null) {
                        dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.alias.email))
                        presentationDisplayValue = "${credential.service.name} (${credential.alias.email})"
                    } else if (credential.username != null) {
                        dataSetBuilder.setValue(field.first, AutofillValue.forText(credential.username))
                        presentationDisplayValue = "${credential.service.name} (${credential.username})"
                    }
                }
            }
        }

        // Set the display value of the dropdown item.
        presentation.setTextViewText(
            R.id.text,
            presentationDisplayValue
        )

        // Set the logo if available
        val logoBytes = credential.service.logo
        if (logoBytes != null) {
            val bitmap = ImageUtils.bytesToBitmap(logoBytes)
            if (bitmap != null) {
                presentation.setImageViewBitmap(R.id.icon, bitmap)
            }
        }

        return dataSetBuilder.build()
    }

    private fun createNoMatchesDataset(fieldFinder: FieldFinder): Dataset {
        // Create presentation for the "no matches" option
        val presentation = RemoteViews(packageName, R.layout.autofill_dataset_item_logo)
        presentation.setTextViewText(
            R.id.text,
            "AliasVault: no matches"
        )

        val dataSetBuilder = Dataset.Builder(presentation)

        // Add a click listener to open AliasVault app
        val intent = Intent(this@AutofillService, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra("OPEN_CREDENTIALS", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            this@AutofillService,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        dataSetBuilder.setAuthentication(pendingIntent.intentSender)

        // Add a placeholder value to both username and password fields to satisfy the requirement that at least one value must be set
        if (fieldFinder.autofillableFields.isNotEmpty()) {
            for (field in fieldFinder.autofillableFields) {
                dataSetBuilder.setValue(field.first, AutofillValue.forText(""))
            }
        }

        return dataSetBuilder.build()
    }

    private fun createOpenAppDataset(fieldFinder: FieldFinder): Dataset {
        val openAppPresentation = RemoteViews(packageName, R.layout.autofill_dataset_item_logo)
        openAppPresentation.setTextViewText(
            R.id.text,
            "Open app"
        )

        val dataSetBuilder = Dataset.Builder(openAppPresentation)

        // Add a click listener to open AliasVault app
        val intent = Intent(this@AutofillService, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra("OPEN_CREDENTIALS", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            this@AutofillService,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        dataSetBuilder.setAuthentication(pendingIntent.intentSender)

        // Set an empty value for the field to satisfy the requirement
        if (fieldFinder.autofillableFields.isNotEmpty()) {
            for (field in fieldFinder.autofillableFields) {
                dataSetBuilder.setValue(field.first, AutofillValue.forText(""))
            }
        }

        return dataSetBuilder.build()
    }

    private fun createVaultLockedDataset(fieldFinder: FieldFinder): Dataset {
        // Create presentation for the "vault locked" option
        val presentation = RemoteViews(packageName, R.layout.autofill_dataset_item_logo)
        presentation.setTextViewText(
            R.id.text,
            "Vault locked"
        )

        val dataSetBuilder = Dataset.Builder(presentation)

        // Add a click listener to open AliasVault app
        val intent = Intent(this@AutofillService, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra("OPEN_CREDENTIALS", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            this@AutofillService,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        dataSetBuilder.setAuthentication(pendingIntent.intentSender)

        // Add a placeholder value to both username and password fields to satisfy the requirement that at least one value must be set
        if (fieldFinder.autofillableFields.isNotEmpty()) {
            for (field in fieldFinder.autofillableFields) {
                dataSetBuilder.setValue(field.first, AutofillValue.forText(""))
            }
        }

        return dataSetBuilder.build()
    }

    private fun filterCredentialsByAppInfo(credentials: List<Credential>, appInfo: String): List<Credential> {
        return credentialMatcher.filterCredentialsByAppInfo(credentials, appInfo)
    }

    companion object {
        private const val TAG = "AliasVaultAutofill"
    }
}
