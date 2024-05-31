namespace AliasVault.Services;

using Microsoft.JSInterop;

/// <summary>
/// Service for invoking JavaScript functions from C#.
/// </summary>
public class JsInvokeService
{
    private IJSRuntime Js { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="JsInvokeService"/> class.
    /// </summary>
    /// <param name="js">The IJSRuntime object.</param>
    public JsInvokeService(IJSRuntime js)
    {
        Js = js;
    }

    public async Task RetryInvokeAsync(string functionName, TimeSpan initialDelay, int maxAttempts, params object[] args)
    {
        TimeSpan delay = initialDelay;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                bool isDefined = await this.Js.InvokeAsync<bool>("isFunctionDefined", functionName);
                if (isDefined)
                {
                    await this.Js.InvokeVoidAsync(functionName, args);
                    return; // Successfully called the JS function, exit the method
                }
            }
            catch (Exception ex)
            {
                // Optionally log the exception
            }

            // Wait for the delay before the next attempt
            await Task.Delay(delay);

            // Exponential backoff: double the delay for the next attempt
            delay = TimeSpan.FromTicks(delay.Ticks * 2);
        }

        // Optionally log that the JS function could not be called after maxAttempts
    }
}
