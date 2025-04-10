package net.aliasvault.app
import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.SaveCallback
import android.service.autofill.SaveRequest
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.O)
class AutofillService : AutofillService() {
    override fun onFillRequest(
        request: FillRequest,
        cancellationSignal: CancellationSignal,
        callback: FillCallback
    ) {
        // 1. Parse the structure of the form
        // 2. Check for autofillable fields
        // 3. Create Dataset with credentials
        // 4. Call callback.onSuccess()
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        // Optionally handle saving credentials
        callback.onSuccess()
    }
}
