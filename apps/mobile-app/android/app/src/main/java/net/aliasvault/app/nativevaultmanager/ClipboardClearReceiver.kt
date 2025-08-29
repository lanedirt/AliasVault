package net.aliasvault.app.nativevaultmanager

import android.content.BroadcastReceiver
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BroadcastReceiver to clear the clipboard when triggered by AlarmManager.
 * This ensures clipboard clearing works even when the app is in the background.
 */
class ClipboardClearReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ClipboardClearReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        try {
            Log.d(TAG, "Received broadcast to clear clipboard")

            val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboardManager.clearPrimaryClip()

            Log.d(TAG, "Clipboard cleared successfully from broadcast receiver")
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing clipboard from broadcast receiver", e)
        }
    }
}
