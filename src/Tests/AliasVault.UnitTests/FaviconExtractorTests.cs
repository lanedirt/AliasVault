namespace AliasVault.Tests;

public class FaviconExtractorTests
{
    [SetUp]
    public void Setup()
    {
    }

    [Test]
    public void ExtractFaviconSpamOK()
    {
        var faviconBytes = FaviconExtractor.FaviconService.GetFaviconAsync("https://spamok.com");
        Assert.That(faviconBytes, Is.Not.Null);
    }
}
