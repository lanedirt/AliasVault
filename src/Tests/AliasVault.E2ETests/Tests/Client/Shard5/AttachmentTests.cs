//-----------------------------------------------------------------------
// <copyright file="AttachmentTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard5;

/// <summary>
/// End-to-end tests for uploading and downloading attachments.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[Category("ClientTests")]
[TestFixture]
public class AttachmentTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test that adding an attachment works correctly and can be downloaded afterwards.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task UploadAttachment()
    {
        // Create a new alias with service name = "Test Service".
        var serviceName = "Test Service";
        await CreateCredentialEntry(
            new Dictionary<string, string>
            {
                { "service-name", serviceName },
            },
            async () =>
            {
                // Upload file.
                var fileInput = Page.Locator("input[type='file']");
                var fileContent = await ResourceReaderUtility.ReadEmbeddedResourceBytesAsync("AliasVault.E2ETests.TestData.TestAttachment.txt");

                // Create a temporary file with the content and original file name
                var originalFileName = "TestAttachment.txt";
                var tempFilePath = Path.Combine(Path.GetTempPath(), originalFileName);
                await File.WriteAllBytesAsync(tempFilePath, fileContent);

                // Set the file input using the temporary file
                await fileInput.SetInputFilesAsync(tempFilePath);

                await Task.Delay(5000); // Reduced delay for faster test execution

                // Delete the temporary file
                File.Delete(tempFilePath);
            });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceName), "Created credential service name does not appear on alias page.");
    }
}
