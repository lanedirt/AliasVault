//-----------------------------------------------------------------------
// <copyright file="VersionTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.UnitTests.Vault;

using AliasVault.Api.Helpers;

/// <summary>
/// Tests for the Vault version comparison methods.
/// </summary>
public class VersionTests
{
    /// <summary>
    /// Test the version comparison for lower versions.
    /// </summary>
    [Test]
    public void VersionLowerComparisonTrueTest()
    {
        var version1 = "1.0.0";
        var version2 = "1.0.1";
        Assert.That(VersionHelper.IsVersionOlder(version1, version2), Is.True);
    }

    /// <summary>
    /// Test the version comparison for higher versions.
    /// </summary>
    [Test]
    public void VersionLowerComparisonFalseTest()
    {
        var version1 = "1.2.0";
        var version2 = "1.0.1";
        Assert.That(VersionHelper.IsVersionOlder(version1, version2), Is.False);
    }

    /// <summary>
    /// Test the version comparison throws an exception for illegal version strings.
    /// </summary>
    [Test]
    public void VersionLowerComparisonExceptionTest()
    {
        var version1 = "1.2.0.5.1";
        var version2 = "1.0.1";
        Assert.Throws<ArgumentException>(() => VersionHelper.IsVersionOlder(version1, version2));
    }

    /// <summary>
    /// Test the version comparison throws an exception for illegal version strings.
    /// </summary>
    [Test]
    public void VersionEqualOrNewerComparisonExceptionTest()
    {
        var version1 = "1.2.0.5.1";
        var version2 = "1.0.1";
        Assert.Throws<ArgumentException>(() => VersionHelper.IsVersionOlder(version1, version2));
    }

    /// <summary>
    /// Test the version comparison returns true for equal versions.
    /// </summary>
    [Test]
    public void VersionEqualComparisonTest()
    {
        var version1 = "1.2.0";
        var version2 = "1.1.0";
        Assert.That(VersionHelper.IsVersionEqualOrNewer(version1, version2), Is.True);
    }
}
