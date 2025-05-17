package net.aliasvault.app.nativevaultmanager

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log

class VaultDatabase(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {
    private var currentTransaction: SQLiteDatabase? = null

    override fun onCreate(db: SQLiteDatabase) {
        // Create tables as needed
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS vault_data (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Handle database upgrades if needed
        db.execSQL("DROP TABLE IF EXISTS vault_data")
        onCreate(db)
    }

    fun beginTransaction() {
        currentTransaction = writableDatabase
        currentTransaction?.beginTransaction()
    }

    fun commitTransaction() {
        currentTransaction?.setTransactionSuccessful()
        currentTransaction?.endTransaction()
        currentTransaction = null
    }

    fun rollbackTransaction() {
        currentTransaction?.endTransaction()
        currentTransaction = null
    }

    fun executeQuery(query: String, params: Array<Any?>): List<Map<String, Any?>> {
        val db = readableDatabase
        val results = mutableListOf<Map<String, Any?>>()

        db.rawQuery(query, params.map { it?.toString() }.toTypedArray()).use { cursor ->
            val columnNames = cursor.columnNames
            while (cursor.moveToNext()) {
                val row = mutableMapOf<String, Any?>()
                for (columnName in columnNames) {
                    when (cursor.getType(cursor.getColumnIndexOrThrow(columnName))) {
                        android.database.Cursor.FIELD_TYPE_INTEGER -> row[columnName] = cursor.getLong(cursor.getColumnIndexOrThrow(columnName))
                        android.database.Cursor.FIELD_TYPE_FLOAT -> row[columnName] = cursor.getDouble(cursor.getColumnIndexOrThrow(columnName))
                        android.database.Cursor.FIELD_TYPE_STRING -> row[columnName] = cursor.getString(cursor.getColumnIndexOrThrow(columnName))
                        android.database.Cursor.FIELD_TYPE_BLOB -> row[columnName] = cursor.getBlob(cursor.getColumnIndexOrThrow(columnName))
                        android.database.Cursor.FIELD_TYPE_NULL -> row[columnName] = null
                    }
                }
                results.add(row)
            }
        }

        return results
    }

    fun executeUpdate(query: String, params: Array<Any?>): Int {
        val db = currentTransaction ?: writableDatabase
        db.execSQL(query, params.map { it?.toString() }.toTypedArray())
        return 1 // Return 1 to indicate success, or you could return the actual number of affected rows if available
    }

    companion object {
        private const val TAG = "VaultDatabase"
        private const val DATABASE_NAME = "vault.db"
        private const val DATABASE_VERSION = 1
    }
}