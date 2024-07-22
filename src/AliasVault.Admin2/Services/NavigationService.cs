using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;

namespace AliasVault.Admin2.Services;

/// <summary>
/// Navigation helper service.
/// </summary>
public class NavigationService
{
    private readonly NavigationManager _navigationManager;

    private string CurrentPath => _navigationManager.ToAbsoluteUri(_navigationManager.Uri).GetLeftPart(UriPartial.Path);

    /// <summary>
    /// Redirect to the current page.
    /// </summary>
    public void RedirectToCurrentPage() => RedirectTo(CurrentPath);

    public string BaseUri => _navigationManager.BaseUri;
    public string Uri => _navigationManager.Uri;

    public event EventHandler<LocationChangedEventArgs>? LocationChanged;

    /// <summary>
    /// Initializes a new instance of the <see cref="NavigationService"/> class.
    /// </summary>
    /// <param name="navigationManager"></param>
    public NavigationService(NavigationManager navigationManager)
    {
        _navigationManager = navigationManager;
        _navigationManager.LocationChanged += (sender, args) =>
        {
            LocationChanged?.Invoke(sender, args);
        };
    }

    /// <summary>
    /// Redirect to the specified URI.
    /// </summary>
    /// <param name="uri">The uri to redirect to.</param>
    /// <param name="forceLoad">Force load true/false.</param>
    public void RedirectTo(string? uri, bool forceLoad = false)
    {
        uri ??= "";

        // Prevent open redirects.
        if (!System.Uri.IsWellFormedUriString(uri, UriKind.Relative))
        {
            uri = _navigationManager.ToBaseRelativePath(uri);
        }

        _navigationManager.NavigateTo(uri, forceLoad);
    }

    /// <summary>
    /// Redirect to the specified URI with query parameters.
    /// </summary>
    /// <param name="uri"></param>
    /// <param name="queryParameters"></param>
    /// <param name="forceLoad">Force load true/false.</param>
    public void RedirectTo(string uri, Dictionary<string, object?> queryParameters, bool forceLoad = false)
    {
        var uriWithoutQuery = _navigationManager.ToAbsoluteUri(uri).GetLeftPart(UriPartial.Path);
        var newUri = _navigationManager.GetUriWithQueryParameters(uriWithoutQuery, queryParameters);
        RedirectTo(newUri, forceLoad);
    }

    /// <summary>
    /// Returns a URI constructed from <paramref name="uri" /> except with multiple parameters
    /// added, updated, or removed.
    /// </summary>
    /// <param name="uri">The URI with the query to modify.</param>
    /// <param name="parameters">The values to add, update, or remove.</param>
    public string GetUriWithQueryParameters(string uri, IReadOnlyDictionary<string, object?> parameters) => _navigationManager.GetUriWithQueryParameters(uri, parameters);

    /// <summary>
    /// Converts a relative URI into an absolute one (by resolving it
    /// relative to the current absolute URI).
    /// </summary>
    /// <param name="relativeUri">The relative URI.</param>
    /// <returns>The absolute URI.</returns>
    public Uri ToAbsoluteUri(string relativeUri) => _navigationManager.ToAbsoluteUri(relativeUri);
}
