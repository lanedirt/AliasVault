namespace AliasVault.WebApp.Services;

/// <summary>
/// Service to manage the clipboard copy operations across the application.
/// </summary>
public class ClipboardCopyService
{
    private string _currentCopiedId;
    public event Action<string> OnCopy;

    /// <summary>
    /// Keep track of the last copied item.
    /// </summary>
    /// <param name="id"></param>
    public void SetCopied(string id)
    {
        _currentCopiedId = id;
        OnCopy?.Invoke(_currentCopiedId);
    }

    public string GetCopiedId() => _currentCopiedId;
}
