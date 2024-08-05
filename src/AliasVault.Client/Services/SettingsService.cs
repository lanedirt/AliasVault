//-----------------------------------------------------------------------
// <copyright file="SettingsService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using System;
using System.Text.Json;
using System.Threading.Tasks;
using AliasClientDb;

/// <summary>
/// Service class for accessing and mutating general settings stored in database.
/// </summary>
public class SettingsService(DbService dbService)
{
    /// <summary>
    /// Gets the DefaultEmailDomain setting asynchronously.
    /// </summary>
    /// <returns>Default email domain as string.</returns>
    public Task<string> GetDefaultEmailDomainAsync() => GetSettingAsync("DefaultEmailDomain");

    /// <summary>
    /// Sets the DefaultEmailDomain setting asynchronously.
    /// </summary>
    /// <param name="value">The new DeafultEmailDomain setting.</param>
    /// <returns>Task.</returns>
    public Task SetDefaultEmailDomainAsync(string value) => SetSettingAsync("DefaultEmailDomain", value);

    /// <summary>
    /// Gets the AutoEmailRefresh setting asynchronously as a string.
    /// </summary>
    /// <returns>AutoEmailRefresh setting as string.</returns>
    public Task<bool> GetAutoEmailRefreshAsync() => GetSettingAsync<bool>("AutoEmailRefresh");

    /// <summary>
    /// Sets the AutoEmailRefresh setting asynchronously as a string.
    /// </summary>
    /// <param name="value">The new value.</param>
    /// <returns>Task.</returns>
    public Task SetAutoEmailRefreshAsync(bool value) => SetSettingAsync<bool>("AutoEmailRefresh", value);

    /// <summary>
    /// Get setting value from database.
    /// </summary>
    /// <param name="key">Key of setting to retrieve.</param>
    /// <returns>Setting as string value.</returns>
    private async Task<string> GetSettingAsync(string key)
    {
        var db = await dbService.GetDbContextAsync();
        var setting = await db.Settings.FindAsync(key);
        return setting?.Value ?? string.Empty;
    }

    /// <summary>
    /// Gets a setting asynchronously and casts it to the specified type.
    /// </summary>
    /// <typeparam name="T">The type to cast the setting to.</typeparam>
    /// <param name="key">The key of the setting.</param>
    /// <returns>The setting value cast to type T.</returns>
    private async Task<T?> GetSettingAsync<T>(string key)
    {
        string value = await GetSettingAsync(key);
        return CastSetting<T>(value);
    }

    /// <summary>
    /// Sets a setting asynchronously, converting the value to a string so its compatible with the database field.
    /// </summary>
    /// <typeparam name="T">The type of the value being set.</typeparam>
    /// <param name="key">The key of the setting.</param>
    /// <param name="value">The value to set.</param>
    /// <returns>Task.</returns>
    private Task SetSettingAsync<T>(string key, T value)
    {
        string stringValue = ConvertToString(value);
        return SetSettingAsync(key, stringValue);
    }

    /// <summary>
    /// Set setting value in database.
    /// </summary>
    /// <param name="key">Key of setting to set.</param>
    /// <param name="value">Value of setting to set.</param>
    /// <returns>Task.</returns>
    private async Task SetSettingAsync(string key, string value)
    {
        var db = await dbService.GetDbContextAsync();
        var setting = await db.Settings.FindAsync(key);
        if (setting == null)
        {
            setting = new Setting
            {
                Key = key,
                Value = value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            db.Settings.Add(setting);
        }
        else
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
            db.Settings.Update(setting);
        }

        await dbService.SaveDatabaseAsync();
    }

    /// <summary>
    /// Casts a setting value from the database string type to the specified requested type.
    /// </summary>
    /// <param name="value">Value (string) to cast.</param>
    /// <typeparam name="T">Type to cast it to.</typeparam>
    /// <returns>The value casted to the requested type.</returns>
    private T? CastSetting<T>(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            if (default(T) is null)
            {
                return default;
            }

            throw new ArgumentException($"Cannot cast null or empty string to non-nullable type {typeof(T)}");
        }

        if (typeof(T) == typeof(bool))
        {
            return (T)(object)(bool.TryParse(value, out bool result) && result);
        }

        if (typeof(T) == typeof(int))
        {
            return (T)(object)int.Parse(value);
        }

        if (typeof(T) == typeof(double))
        {
            return (T)(object)double.Parse(value);
        }

        if (typeof(T) == typeof(string))
        {
            return (T)(object)value;
        }

        // For complex types, attempt JSON deserialization
        try
        {
            var result = JsonSerializer.Deserialize<T>(value);
            if (result is null && default(T) is not null)
            {
                throw new InvalidOperationException($"Deserialization resulted in null for non-nullable type {typeof(T)}");
            }

            return result;
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to deserialize value to type {typeof(T)}", ex);
        }
    }

    /// <summary>
    /// Converts a value of any type to a string.
    /// </summary>
    /// <param name="value">The value to convert.</param>
    /// <typeparam name="T">The type of the existing value.</typeparam>
    /// <returns>Value converted to string.</returns>
    private string ConvertToString<T>(T value)
    {
        if (value is bool || value is int || value is double || value is string)
        {
            return value.ToString() ?? string.Empty;
        }

        // For complex types, use JSON serialization
        return JsonSerializer.Serialize(value);
    }
}
