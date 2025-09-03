//-----------------------------------------------------------------------
// <copyright file="TotpGeneratorTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.UnitTests.Utilities;

/// <summary>
/// Tests for the TotpGeneratorTests class.
/// </summary>
public class TotpGeneratorTests
{
    private const string TestSecretKey = "JBSWY3DPEHPK3PXP";

    /// <summary>
    /// Tests if the GenerateTotpCode method returns a valid code.
    /// </summary>
    [Test]
    public void GenerateTotpCode_ReturnsValidCode()
    {
        string code = TotpGenerator.TotpGenerator.GenerateTotpCode(TestSecretKey);
        Assert.That(code, Has.Length.EqualTo(6));
        Assert.That(code, Does.Match(@"^\d{6}$"));
    }

    /// <summary>
    /// Tests if the GenerateTotpCode method returns a code with the correct length.
    /// </summary>
    [Test]
    public void GenerateTotpCode_WithCustomDigits_ReturnsCodeWithCorrectLength()
    {
        string code = TotpGenerator.TotpGenerator.GenerateTotpCode(TestSecretKey, digits: 8);
        Assert.That(code, Has.Length.EqualTo(8));
        Assert.That(code, Does.Match(@"^\d{8}$"));
    }

    /// <summary>
    /// Tests if the GenerateTotpCode method returns a code when the secret key contains spaces and hyphens.
    /// </summary>
    [Test]
    public void GenerateTotpCode_WithSpacesAndHyphens_ReturnsValidCode()
    {
        string secretWithSpacesAndHyphens = "JBSW Y3DP-EHPK 3PXP";
        string code = TotpGenerator.TotpGenerator.GenerateTotpCode(secretWithSpacesAndHyphens);
        Assert.That(code, Has.Length.EqualTo(6));
        Assert.That(code, Does.Match(@"^\d{6}$"));
    }

    /// <summary>
    /// Tests if the VerifyTotpCode method returns true for a valid code.
    /// </summary>
    [Test]
    public void VerifyTotpCode_WithValidCode_ReturnsTrue()
    {
        string code = TotpGenerator.TotpGenerator.GenerateTotpCode(TestSecretKey);
        bool isValid = TotpGenerator.TotpGenerator.VerifyTotpCode(TestSecretKey, code);
        Assert.That(isValid, Is.True);
    }

    /// <summary>
    /// Tests if the VerifyTotpCode method returns false for an invalid code.
    /// </summary>
    [Test]
    public void VerifyTotpCode_WithInvalidCode_ReturnsFalse()
    {
        string invalidCode = "000000";
        bool isValid = TotpGenerator.TotpGenerator.VerifyTotpCode(TestSecretKey, invalidCode);
        Assert.That(isValid, Is.False);
    }

    /// <summary>
    /// Tests if the VerifyTotpCode method throws an exception for an invalid secret key.
    /// </summary>
    [Test]
    public void GenerateTotpCode_WithInvalidSecretKey_ThrowsException()
    {
        string invalidSecret = "INVALID!@#";
        Assert.Throws<ArgumentException>(() => TotpGenerator.TotpGenerator.GenerateTotpCode(invalidSecret));
    }
}
