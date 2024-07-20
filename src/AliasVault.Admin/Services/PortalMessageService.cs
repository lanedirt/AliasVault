namespace AliasVault.Admin.Services;

using System.Web;

/// <summary>
/// Handles portal messages that should be displayed to the user, such as success or error messages. These messages
/// are stored in this object which is scoped to the current session. This allows the messages to be cached until
/// they actually have been displayed. So they can survive redirects and page reloads.
/// </summary>
public class PortalMessageService
{
    /// <summary>
    /// Contains success messages that should be displayed to the user. A default set of success messages is added in the parent OnInitialized method.
    /// </summary>
    protected List<string> SuccessMessages { get; set; } = new List<string>();

    /// <summary>
    /// Allow other components to subscribe to changes in the event object.
    /// </summary>
    public event Action? OnChange;

    private void NotifyStateChanged() => OnChange?.Invoke();

    /// <summary>
    /// Public constructor which can be called from static async method or directly.
    /// </summary>
    public PortalMessageService()
    {
    }

    public void AddSuccessMessage(string message, bool notifyStateChanged = true)
    {
        SuccessMessages.Add(message);

        // Notify subscribers that a message has been added.
        if (notifyStateChanged)
        {
            NotifyStateChanged();
        }
    }

    /// <summary>
    /// Returns a dictionary with messages that should be displayed to the user. After this method is called,
    /// the messages are automatically cleared.
    /// </summary>
    /// <returns></returns>
    public Dictionary<string, string> GetMessagesForDisplay()
    {
        var messages = new Dictionary<string, string>();
        foreach (var message in SuccessMessages)
        {
            messages.Add("success", message);
        }

        // Clear messages
        SuccessMessages.Clear();

        return messages;
    }

    /// <summary>
    /// Retrieves messages from the query string (if any) and adds them to the correct messages list.
    /// </summary>
    /// <param name="uri"></param>
    public void RetrieveMessagesFromQueryString(Uri uri)
    {
        var query = HttpUtility.ParseQueryString(uri.Query);
        var successMessage = query.Get("successMessage");
        if (!string.IsNullOrEmpty(successMessage))
        {
            switch (successMessage)
            {
                case "EmailConfirmed":
                    AddSuccessMessage("Your email has successfully been confirmed!");
                    break;
            }
        }
    }
}
