//-----------------------------------------------------------------------
// <copyright file="ConversionHelperTest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Tests.Helpers;

using AliasVault.Api.Helpers;

/// <summary>
/// Tests for the CsvImportExport class.
/// </summary>
public class ConversionHelperTest
{
     /// <summary>
    /// Tests the conversion of an email address with a display name to just the display name.
    /// </summary>
    [Test]
    public void TestFromConversion()
    {
        string from = "\"My full Name\" <myname@example.com>";
        string convertedFrom = ConversionHelper.ConvertFromToFromDisplay(from);

        // Check that conversion works as expected.
        Assert.That(convertedFrom, Is.EqualTo("My full Name"));
    }

    /// <summary>
    /// Tests the conversion of a simple anchor tag to open in a new tab.
    /// </summary>
    [Test]
    public void TestAnchorTabConversionSimple()
    {
        string anchorHtml = "<a href=\"https://dutchamzmasters.lt.acemlnb.com/Prod/link-tracker?redirectUrl=aHR0cHMlM0ElMkYlMkZ3d3cuZHV0Y2hhbXptYXN0ZXJzLmNvbSUyRnRoYW5rLXlvdTloN3poZ3Rp&amp;sig=CpED3rRPX48ddoWTUZURadAYPYgPppT312jUNnvUCPo5&amp;iat=1679512450&amp;a=%7C%7C25799960%7C%7C&amp;account=dutchamzmasters%2Eactivehosted%2Ecom&amp;email=DQeVbqE%2Fy2FD5V3I2cvSxXjJCI3Tg5qfUHKGneOhzjJYZ1kM3LVZcQ%3D%3D%3AvdAW7N7fs1pZlI1ib%2BNbsMYz5m4FssAR&amp;s=5241db963ffe25d6f4b762fc00038ee2&amp;i=163A299A10A816\"></a>";
        string convertedAnchorTags = ConversionHelper.ConvertAnchorTagsToOpenInNewTab(anchorHtml);

        // Check that conversion works as expected.
        Assert.That(convertedAnchorTags, Does.Contain("target=\"_blank\""));
    }

    /// <summary>
    /// Tests the conversion of a complex anchor tag with multiple attributes to open in a new tab.
    /// </summary>
    [Test]
    public void TestAnchorTabConversionComplex1()
    {
        string anchorHtml = "<a\nhref=\"https://dutchamzmasters.lt.acemlnb.com/Prod/link-tracker?redirectUrl=aHR0cHMlM0ElMkYlMkZ3d3cuZHV0Y2hhbXptYXN0ZXJzLmNvbSUyRnRoYW5rLXlvdTloN3poZ3Rp&sig=CpED3rRPX48ddoWTUZURadAYPYgPppT312jUNnvUCPo5&iat=1679512450&a=%7C%7C25799960%7C%7C&account=dutchamzmasters%2Eactivehosted%2Ecom&email=DQeVbqE%2Fy2FD5V3I2cvSxXjJCI3Tg5qfUHKGneOhzjJYZ1kM3LVZcQ%3D%3D%3AvdAW7N7fs1pZlI1ib%2BNbsMYz5m4FssAR&s=5241db963ffe25d6f4b762fc00038ee2&i=163A299A10A816\" data-ac-default-color=\"1\" style=\"margin: 0; outline: none; padding: 0; color: #045FB4; text-decoration: underline; font-weight: bold;\"><span style=\"color: ; font-size: inherit; font-weight: inherit; line-height: inherit; text-decoration: inherit;\">Start hier met de training &gt;&gt;&gt;</span></a>";
        string convertedAnchorTags = ConversionHelper.ConvertAnchorTagsToOpenInNewTab(anchorHtml);

        // Check that conversion works as expected.
        Assert.That(convertedAnchorTags, Does.Contain("target=\"_blank\""));
    }

    /// <summary>
    /// Tests the conversion of a complex anchor tag with nested elements to open in a new tab.
    /// </summary>
    [Test]
    public void TestAnchorTabConversionComplex2()
    {
        string anchorHtml = "<div class=\"btn btn--flat btn--large\" style=\"Margin-bottom: 20px;text-align: center;\">\n        <!--[if !mso]><!--><a style=\"border-radius: 4px;display: inline-block;font-size: 14px;font-weight: bold;line-height: 24px;padding: 12px 24px;text-align: center;text-decoration: none !important;transition: opacity 0.1s ease-in;color: #212529 !important;background-color: #ffdd55;font-family: Open Sans, sans-serif;\" href=\"https://eazegamesbv.cmail19.com/t/j-l-sktidll-ddhdthjhkj-j/\">Haal je beloning op</a><!--<![endif]-->\n      <!--[if mso]><p style=\"line-height:0;margin:0;\">&nbsp;</p><v:roundrect xmlns:v=\"urn:schemas-microsoft-com:vml\" href=\"https://eazegamesbv.cmail19.com/t/j-l-sktidll-ddhdthjhkj-j/\" style=\"width:136.5pt\" arcsize=\"9%\" fillcolor=\"#FFDD55\" stroke=\"f\"><v:textbox style=\"mso-fit-shape-to-text:t\" inset=\"0pt,8.25pt,0pt,8.25pt\"><center style=\"font-size:14px;line-height:24px;color:#212529;font-family:Open Sans,sans-serif;font-weight:bold;mso-line-height-rule:exactly;mso-text-raise:1.5px\">Haal je beloning op</center></v:textbox></v:roundrect><![endif]--></div>";
        string convertedAnchorTags = ConversionHelper.ConvertAnchorTagsToOpenInNewTab(anchorHtml);

        // Check that conversion works as expected.
        Assert.That(convertedAnchorTags, Does.Contain("target=\"_blank\""));
    }

    /// <summary>
    /// Tests the conversion of a complex anchor tag within a table cell to open in a new tab.
    /// </summary>
    [Test]
    public void TestAnchorTabConversionComplex3()
    {
        string anchorHtml = "<td style=\"word-wrap: break-word; -webkit-hyphens: auto; -moz-hyphens: auto; hyphens: auto; vertical-align: top; font-family: Helvetica, Arial, sans-serif; font-weight: normal; margin: 0; Margin: 0; font-size: 16px; line-height: 1.3; text-align: center; color: #fefefe; background: #f17130; border-radius: 5px; border: 0 solid #f17130; width: 400px; padding: 5px; border-collapse: collapse;\"><a href=\"https://click.info.wijkopenautos.nl/f/a/chSbfTJZeP5dGZaVjOIUlw~~/AABMyAA~/RgRnzW26P0SwaHR0cHM6Ly93d3cud2lqa29wZW5hdXRvcy5ubC9pbnNwZWN0aW9uL2UwZTg0M2Y4NGEzZDRjYjc4MDYwMGU2NDEzNzc1NmEyLz9NSUQ9TkxfQ1JNXzFfM18wXzE5NjY3MF8yNDE5NTgwMTEyNDdfMSZ0bXM9MTcwOTg5Mzc4MyZ1dG1fc291cmNlPUNSTSZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9jYW1wYWlnbj0zXzdXBXNwY2V1Qgpl6bro6mX9yH0mUhJidWxhYmVlckBhc2Rhc2QubmxYBAAAAAw~\" style=\"margin: 0; Margin: 0; line-height: 1.3; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; color: #fefefe; text-decoration: none; display: inline-block; background: #f17130; border: 0 solid #f17130; width: 400px; text-align: center; padding: 5px; border-radius: 5px;\">Ontvang nu jouw prijs&nbsp;&nbsp;<b>&gt;</b></a></td>";
        string convertedAnchorTags = ConversionHelper.ConvertAnchorTagsToOpenInNewTab(anchorHtml);

        // Check that conversion works as expected.
        Assert.That(convertedAnchorTags, Does.Contain("target=\"_blank\""));
    }
}
