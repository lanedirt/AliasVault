package net.aliasvault.app.autofill

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.util.Base64
import android.util.Log
import android.content.res.Resources
import com.caverock.androidsvg.SVG
import java.io.ByteArrayOutputStream

object ImageUtils {
    private const val TAG = "ImageUtils"
    private const val TARGET_SIZE_DP = 24
    private const val RENDER_SCALE_FACTOR = 4

    fun detectMimeType(bytes: ByteArray): String {
        // SVG heuristic
        if (bytes.size >= 5) {
            val header = String(bytes, 0, 5).lowercase()
            if (header.contains("<?xml") || header.contains("<svg")) {
                return "image/svg+xml"
            }
        }
        // PNG
        if (bytes.size >= 4 &&
            bytes[0] == 0x89.toByte() &&
            bytes[1] == 0x50.toByte() &&
            bytes[2] == 0x4E.toByte() &&
            bytes[3] == 0x47.toByte()
        ) {
            return "image/png"
        }
        // ICO
        if (bytes.size >= 4 &&
            bytes[0] == 0x00.toByte() &&
            bytes[1] == 0x00.toByte() &&
            bytes[2] == 0x01.toByte() &&
            bytes[3] == 0x00.toByte()
        ) {
            return "image/x-icon"
        }
        return "image/x-icon"
    }

    fun bytesToBitmap(bytes: ByteArray): Bitmap? {
        return try {
            when (detectMimeType(bytes)) {
                "image/svg+xml" -> svgToBitmap(bytes)
                else -> BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error converting bytes to bitmap", e)
            null
        }
    }

    private fun svgToBitmap(bytes: ByteArray): Bitmap? {
        return try {
            val svg = SVG.getFromString(String(bytes, Charsets.UTF_8))

            // Convert dp to pixels based on screen density
            val density = Resources.getSystem().displayMetrics.density
            val targetSizePx = (TARGET_SIZE_DP * density).toInt()
            val renderSize = targetSizePx * RENDER_SCALE_FACTOR

            svg.setDocumentWidth(renderSize.toFloat())
            svg.setDocumentHeight(renderSize.toFloat())

            // Create bitmap & canvas at larger size
            val largeBitmap = Bitmap.createBitmap(renderSize, renderSize, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(largeBitmap)
            svg.renderToCanvas(canvas)

            // Scale down to target size with better quality
            Bitmap.createScaledBitmap(largeBitmap, targetSizePx, targetSizePx, true)
        } catch (e: Exception) {
            Log.e(TAG, "Error rendering SVG to bitmap", e)
            null
        }
    }

    fun bitmapToBytes(bitmap: Bitmap): ByteArray {
        return ByteArrayOutputStream().use { stream ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            stream.toByteArray()
        }
    }

    fun base64ToBytes(base64: String): ByteArray? =
        try { Base64.decode(base64, Base64.DEFAULT) }
        catch (e: Exception) { null }
}
