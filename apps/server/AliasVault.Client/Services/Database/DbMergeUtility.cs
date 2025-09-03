//-----------------------------------------------------------------------
// <copyright file="DbMergeUtility.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services.Database;

using System.Globalization;
using Microsoft.Data.Sqlite;

/// <summary>
/// Class with helper methods to merge two or more vaults.
/// </summary>
public static class DbMergeUtility
{
    /// <summary>
    /// Retrieves the names of all tables in the SQLite database.
    /// </summary>
    /// <param name="connection">The SQLite connection to use.</param>
    /// <returns>A list of table names.</returns>
    /// <returns>List of table names.</returns>
    public static async Task<List<string>> GetTableNames(SqliteConnection connection)
    {
        var tables = new List<string>();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';";
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }

        return tables;
    }

    /// <summary>
    /// Merges data from a source table into a base table.
    /// </summary>
    /// <param name="baseConnection">The connection to the base database.</param>
    /// <param name="sourceConnection">The connection to the source database.</param>
    /// <param name="tableName">The name of the table to merge.</param>
    /// <param name="logger">ILogger instance.</param>
    /// <returns>Task.</returns>
    public static async Task MergeTable(SqliteConnection baseConnection, SqliteConnection sourceConnection, string tableName, ILogger<DbService> logger)
    {
        await using var baseCommand = baseConnection.CreateCommand();
        await using var sourceCommand = sourceConnection.CreateCommand();

        baseCommand.CommandText = $"PRAGMA table_info({tableName})";
        var columns = new List<string>();

        // Get column names from the base table.
        await using (var reader = await baseCommand.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                string columnName = reader.GetString(1);
                columns.Add(columnName);
            }
        }

        // Check if the table has Id, UpdatedAt and IsDeleted columns which are required in order to merge.
        // If columns are missing, skip the table.
        if (!columns.Contains("Id") || !columns.Contains("UpdatedAt") || !columns.Contains("IsDeleted"))
        {
            return;
        }

        // Get all records from the source table.
        sourceCommand.CommandText = $"SELECT * FROM {tableName}";
        await using var sourceReader = await sourceCommand.ExecuteReaderAsync();

        logger.LogDebug("Got records for {tableName}.", tableName);
        while (await sourceReader.ReadAsync())
        {
            var id = sourceReader.GetValue(0);
            var updatedAt = sourceReader.GetDateTime(columns.IndexOf("UpdatedAt"));

            // Check if the record exists in the base table.
            baseCommand.CommandText = $"SELECT UpdatedAt FROM {tableName} WHERE Id = @Id";
            baseCommand.Parameters.Clear();
            baseCommand.Parameters.AddWithValue("@Id", id);

            logger.LogDebug("Checking if record exists in {tableName}.", tableName);

            var existingRecord = await baseCommand.ExecuteScalarAsync();
            if (existingRecord != null)
            {
                logger.LogDebug("Record exists in {tableName}.", tableName);

                // Record exists, compare UpdatedAt if it exists.
                logger.LogDebug("Comparing UpdatedAt in {tableName}.", tableName);
                logger.LogDebug("UpdatedAt: {existingRecord}", existingRecord);
                var baseUpdatedAt = DateTime.Parse((string)existingRecord, CultureInfo.InvariantCulture);
                if (updatedAt > baseUpdatedAt)
                {
                    // Source record is newer, update the base record.
                    await UpdateRecord(baseConnection, tableName, sourceReader, columns);
                }
                else
                {
                    // Base record is newer, skip.
                    logger.LogDebug("Base record is newer, skipping {tableName}.", tableName);
                }
            }
            else
            {
                // Record doesn't exist in base, add it.
                await InsertRecord(baseConnection, tableName, sourceReader, columns);
            }
        }

        logger.LogDebug("Finished merging {tableName}.", tableName);
    }

    /// <summary>
    /// Inserts a new record into the specified table with data from the source reader.
    /// </summary>
    /// <param name="connection">The SQLite connection to use.</param>
    /// <param name="tableName">The name of the table to insert into.</param>
    /// <param name="sourceReader">The data reader containing the source record.</param>
    /// <param name="columns">The list of column names in the table.</param>
    /// <returns>Task.</returns>
    private static async Task InsertRecord(SqliteConnection connection, string tableName, SqliteDataReader sourceReader, List<string> columns)
    {
        await using var command = connection.CreateCommand();
        var columnNames = string.Join(", ", columns);
        var parameterNames = string.Join(", ", columns.Select(c => $"@{c}"));
        command.CommandText = $"INSERT INTO {tableName} ({columnNames}) VALUES ({parameterNames})";

        for (int i = 0; i < columns.Count; i++)
        {
            command.Parameters.AddWithValue($"@{columns[i]}", sourceReader.GetValue(i));
        }

        await command.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Updates a record in the specified table with data from the source reader.
    /// </summary>
    /// <param name="connection">The SQLite connection to use.</param>
    /// <param name="tableName">The name of the table to update.</param>
    /// <param name="sourceReader">The data reader containing the source record.</param>
    /// <param name="columns">The list of column names in the table.</param>
    /// <returns>Task.</returns>
    private static async Task UpdateRecord(SqliteConnection connection, string tableName, SqliteDataReader sourceReader, List<string> columns)
    {
        await using var command = connection.CreateCommand();
        var updateColumns = string.Join(", ", columns.Select(c => $"{c} = @{c}"));
        command.CommandText = $"UPDATE {tableName} SET {updateColumns} WHERE Id = @Id";

        for (int i = 0; i < columns.Count; i++)
        {
            command.Parameters.AddWithValue($"@{columns[i]}", sourceReader.GetValue(i));
        }

        await command.ExecuteNonQueryAsync();
    }
}
