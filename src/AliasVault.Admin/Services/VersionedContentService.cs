namespace AliasVault.Admin.Services;

using System.Security.Cryptography;

/// <summary>
/// Service to provide versioned content paths for cache busting of static files.
/// </summary>
public class VersionedContentService
{
    private readonly string _webRootPath;

    private Dictionary<string, string> _hashCache = new Dictionary<string, string>();

    public VersionedContentService(string webRootPath)
    {
        _webRootPath = webRootPath ?? throw new ArgumentNullException(nameof(webRootPath));
    }

    public string GetVersionedPath(string contentPath)
    {
        if (!_hashCache.TryGetValue(contentPath, out var version))
        {
            var serverPath = Path.Combine(_webRootPath, contentPath.TrimStart('/'));
            version = GetVersionHashFrom(serverPath);
            _hashCache[contentPath] = version;
        }

        return $"{contentPath}?v={version}";
    }

    private string GetVersionHashFrom(string serverPath)
    {
        using var md5 = MD5.Create();
        using var stream = File.OpenRead(serverPath);
        byte[] hash = md5.ComputeHash(stream);
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }
}
