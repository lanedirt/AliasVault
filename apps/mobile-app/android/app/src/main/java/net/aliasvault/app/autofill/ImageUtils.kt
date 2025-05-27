package net.aliasvault.app.autofill

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

object ImageUtils {
    fun detectMimeType(bytes: ByteArray): String {
        // Check for SVG
        if (bytes.size >= 5) {
            val header = String(bytes.slice(0..4).toByteArray()).lowercase()
            if (header.contains("<?xml") || header.contains("<svg")) {
                return "image/svg+xml"
            }
        }

        // Check for PNG
        if (bytes.size >= 4 &&
            bytes[0] == 0x89.toByte() &&
            bytes[1] == 0x50.toByte() &&
            bytes[2] == 0x4E.toByte() &&
            bytes[3] == 0x47.toByte()
        ) {
            return "image/png"
        }

        // Check for ICO
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
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (e: Exception) {
            null
        }
    }

    fun bitmapToBytes(bitmap: Bitmap): ByteArray {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        return stream.toByteArray()
    }

    fun base64ToBytes(base64: String): ByteArray? {
        return try {
            Base64.decode(base64, Base64.DEFAULT)
        } catch (e: Exception) {
            null
        }
    }
}