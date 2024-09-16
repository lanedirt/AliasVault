//-----------------------------------------------------------------------
// <copyright file="DbMergeUtility.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services.Database;

using System.Data;
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
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';";
        using var reader = await command.ExecuteReaderAsync();
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
    /// <returns>Task.</returns>
    public static async Task MergeTable(SqliteConnection baseConnection, SqliteConnection sourceConnection, string tableName)
    {
        using var baseCommand = baseConnection.CreateCommand();
        using var sourceCommand = sourceConnection.CreateCommand();

        // Check if the table has UpdatedAt and IsDeleted columns
        baseCommand.CommandText = $"PRAGMA table_info({tableName})";
        var columns = new List<string>();
        using (var reader = await baseCommand.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                columns.Add(reader.GetString(1));
            }
        }

        bool hasUpdatedAt = columns.Contains("UpdatedAt");
        bool hasIsDeleted = columns.Contains("IsDeleted");

        // Get all records from the source table
        sourceCommand.CommandText = $"SELECT * FROM {tableName}";
        using var sourceReader = await sourceCommand.ExecuteReaderAsync();

        while (await sourceReader.ReadAsync())
        {
            var id = sourceReader.GetValue(0); // Assuming the first column is always the ID
            var updatedAt = hasUpdatedAt ? sourceReader.GetDateTime(columns.IndexOf("UpdatedAt")) : DateTime.MinValue;
            var isDeleted = hasIsDeleted && sourceReader.GetBoolean(columns.IndexOf("IsDeleted"));

            // Check if the record exists in the base table
            baseCommand.CommandText = $"SELECT * FROM {tableName} WHERE Id = @Id";
            baseCommand.Parameters.Clear();
            baseCommand.Parameters.AddWithValue("@Id", id);

            using var baseReader = await baseCommand.ExecuteReaderAsync();
            if (await baseReader.ReadAsync())
            {
                // Record exists, compare UpdatedAt
                if (hasUpdatedAt)
                {
                    var baseUpdatedAt = baseReader.GetDateTime(columns.IndexOf("UpdatedAt"));
                    if (updatedAt > baseUpdatedAt)
                    {
                        // Source record is newer, update the base record
                        await UpdateRecord(baseConnection, tableName, sourceReader, columns);
                    }
                }
            }
            else
            {
                // Record doesn't exist in base, add it
                await InsertRecord(baseConnection, tableName, sourceReader, columns);
            }
        }
    }

    /// <summary>
    /// Updates a record in the specified table with data from the source reader.
    /// </summary>
    /// <param name="connection">The SQLite connection to use.</param>
    /// <param name="tableName">The name of the table to update.</param>
    /// <param name="sourceReader">The data reader containing the source record.</param>
    /// <param name="columns">The list of column names in the table.</param>
    /// <returns>Task.</returns>
    public static async Task UpdateRecord(SqliteConnection connection, string tableName, SqliteDataReader sourceReader, List<string> columns)
    {
        using var command = connection.CreateCommand();
        var updateColumns = string.Join(", ", columns.Select(c => $"{c} = @{c}"));
        command.CommandText = $"UPDATE {tableName} SET {updateColumns} WHERE Id = @Id";

        for (int i = 0; i < columns.Count; i++)
        {
            command.Parameters.AddWithValue($"@{columns[i]}", sourceReader.GetValue(i));
        }

        await command.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Inserts a new record into the specified table with data from the source reader.
    /// </summary>
    /// <param name="connection">The SQLite connection to use.</param>
    /// <param name="tableName">The name of the table to insert into.</param>
    /// <param name="sourceReader">The data reader containing the source record.</param>
    /// <param name="columns">The list of column names in the table.</param>
    /// <returns>Task.</returns>
    public static async Task InsertRecord(SqliteConnection connection, string tableName, SqliteDataReader sourceReader, List<string> columns)
    {
        using var command = connection.CreateCommand();
        var columnNames = string.Join(", ", columns);
        var parameterNames = string.Join(", ", columns.Select(c => $"@{c}"));
        command.CommandText = $"INSERT INTO {tableName} ({columnNames}) VALUES ({parameterNames})";

        for (int i = 0; i < columns.Count; i++)
        {
            command.Parameters.AddWithValue($"@{columns[i]}", sourceReader.GetValue(i));
        }

        await command.ExecuteNonQueryAsync();
    }
}
