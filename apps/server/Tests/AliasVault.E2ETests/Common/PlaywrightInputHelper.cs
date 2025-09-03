//-----------------------------------------------------------------------
// <copyright file="PlaywrightInputHelper.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Common;

/// <summary>
/// Playwright input helper class.
/// </summary>
/// <param name="page">The IPage instance for the current test.</param>
public class PlaywrightInputHelper(IPage page)
{
    private static readonly Random Random = new();

    /// <summary>
    /// Generate a random string of specified length.
    /// </summary>
    /// <param name="length">Length of the string.</param>
    /// <returns>The random generated string.</returns>
    public static string GenerateRandomString(int length = 10)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[Random.Next(s.Length)]).ToArray());
    }

    /// <summary>
    /// Generate a random email address.
    /// </summary>
    /// <returns>The random email address.</returns>
    public static string GenerateRandomEmail()
    {
        return $"{GenerateRandomString(5)}@example.com";
    }

    /// <summary>
    /// Generate a random number.
    /// </summary>
    /// <returns>The random number.</returns>
    public static string GenerateRandomNumber()
    {
        return Random.Next(0, 10000).ToString();
    }

    /// <summary>
    /// Generate a random password of specified length.
    /// </summary>
    /// <param name="length">The length of the password.</param>
    /// <returns>The random generated password.</returns>
    public static string GenerateRandomPassword(int length = 12)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[Random.Next(s.Length)]).ToArray());
    }

    /// <summary>
    /// Generate a random birthdate between 1800 and current year in yyyy-MM-dd format.
    /// </summary>
    /// <returns>The random birthdate string.</returns>
    public static string GenerateRandomBirthdate()
    {
        int minYear = 1800;
        int maxYear = DateTime.Now.Year;
        int year = Random.Next(minYear, maxYear + 1);
        int month = Random.Next(1, 13);
        int day = Random.Next(1, DateTime.DaysInMonth(year, month) + 1);
        return $"{year:0000}-{month:00}-{day:00}";
    }

    /// <summary>
    /// Helper method to fill specified input fields on a page with given values.
    /// </summary>
    /// <param name="fieldValues">Dictionary with html element ids and values to input as field value.</param>
    /// <returns>Async task.</returns>
    public async Task FillInputFields(Dictionary<string, string>? fieldValues = null)
    {
        var inputFields = page.Locator("input, textarea");
        var count = await inputFields.CountAsync();
        for (int i = 0; i < count; i++)
        {
            var input = inputFields.Nth(i);
            var inputId = await input.GetAttributeAsync("id");

            // If fieldValues dictionary is provided and the inputId is found in it, fill the input with the value.
            if (inputId is not null && fieldValues is not null && fieldValues.TryGetValue(inputId, out var fieldValue))
            {
                await input.FillAsync(fieldValue);
            }
        }
    }

    /// <summary>
    /// Helper method to fill all empty input fields on a page with random data if not provided.
    /// </summary>
    /// <returns>Async task.</returns>
    public async Task FillEmptyInputFieldsWithRandom()
    {
        var inputFields = page.Locator("input");
        var skipIds = new List<string> { "searchWidget" };
        var count = await inputFields.CountAsync();
        for (int i = 0; i < count; i++)
        {
            var input = inputFields.Nth(i);
            var inputType = await input.GetAttributeAsync("type");
            var inputId = await input.GetAttributeAsync("id");

            // If is not empty, skip.
            if (!string.IsNullOrEmpty(await input.InputValueAsync()))
            {
                continue;
            }

            // If input type is a file, skip.
            if (inputType == "file")
            {
                continue;
            }

            // If skipIds contains the inputId, skip.
            if (inputId is not null && skipIds.Contains(inputId))
            {
                continue;
            }

            // Generate appropriate random data based on input type.
            string randomData;

            // Check for birthdate field
            if (inputId == "birthdate")
            {
                randomData = GenerateRandomBirthdate();
            }
            else
            {
                randomData = inputType switch
                {
                    "email" => GenerateRandomEmail(),
                    "number" => GenerateRandomNumber(),
                    "password" => GenerateRandomPassword(),
                    _ => GenerateRandomString(), // Default for all other types.
                };
            }

            await input.FillAsync(randomData);
        }
    }
}
