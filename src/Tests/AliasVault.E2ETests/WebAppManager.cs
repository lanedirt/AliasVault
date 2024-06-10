namespace AliasVault.E2ETests;

using System.Diagnostics;
using System.Net;

public class WebAppManager
{
    private Process _webApiProcess;
    private List<string> _webApiErrors = new();
    private Process _blazorWasmProcess;
    private List<string> _blazorWasmErrors = new();

    private string GetBaseDirectory()
    {
        string currentDir = Directory.GetCurrentDirectory();
        // Adjust this if your solution directory is different
        string baseDir = Directory.GetParent(currentDir).Parent.Parent.FullName;
        return baseDir;
    }

    public async Task StartWebApiAsync(int port)
    {
        var projectPath = $"{GetBaseDirectory()}/../../AliasVault.Api/AliasVault.Api.csproj";
        _webApiProcess = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"run --project {projectPath} --urls=http://localhost:{port}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        _webApiProcess.OutputDataReceived += (sender, args) =>
        {
            TestContext.Progress.WriteLine("WebAPI: " + args.Data);
            if (args.Data != null && args.Data.Contains("error"))
            {
                _webApiErrors.Add(args.Data);
            }
        };
        _webApiProcess.ErrorDataReceived += (sender, args) =>
        {
            if (args.Data != null && !string.IsNullOrEmpty(args.Data))
            {
                _webApiErrors.Add(args.Data);
            }
        };

        try
        {
            _webApiProcess.Start();
            _webApiProcess.BeginOutputReadLine();
            _webApiProcess.BeginErrorReadLine();
            TestContext.Progress.WriteLine("WebAPI process started, waiting for startup...");

            await WaitForStartupAsync(port);
            TestContext.Progress.WriteLine("WebAPI started successfully.");
        }
        catch (Exception ex)
        {
            TestContext.Progress.WriteLine($"Failed to start WebAPI: {ex.Message}");
        }
    }

    public async Task StartBlazorWasmAsync(int port)
    {
        var projectPath = $"{GetBaseDirectory()}/../../AliasVault.WebApp/AliasVault.WebApp.csproj";

        _blazorWasmProcess = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"run --project {projectPath} --urls=http://localhost:{port}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            }
        };

        _blazorWasmProcess.OutputDataReceived += (sender, args) => Console.WriteLine(args.Data);
        _blazorWasmProcess.ErrorDataReceived += (sender, args) =>
        {
            _blazorWasmErrors.Add(args.Data);

        };

        _blazorWasmProcess.Start();
        _blazorWasmProcess.BeginOutputReadLine();
        _blazorWasmProcess.BeginErrorReadLine();

        await WaitForStartupAsync(port);
    }

    private async Task WaitForStartupAsync(int port)
    {
        // Wait for the application to start up
        var started = false;
        while (!started)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    var response = await client.GetAsync($"http://localhost:{port}");
                    started = response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.NotFound;
                }
            }
            catch (Exception e)
            {
                if (_webApiErrors != null && _webApiErrors.Count > 0)
                {
                    // Concatenate all errors and fail the test
                    Assert.Fail($"WebAPI failed to start: {string.Join(Environment.NewLine, _webApiErrors)}");
                    return;
                }
                if (_blazorWasmErrors != null && _blazorWasmErrors.Count > 0)
                {
                    Assert.Fail($"WASM failed to start: {string.Join(Environment.NewLine, _webApiErrors)}");
                    return;
                }

                Console.WriteLine(e.Message);
                await Task.Delay(500);
            }
        }
    }

    public void StopWebApi()
    {
        if (_webApiProcess.HasExited)
        {
#if WINDOWS
            KillProcessAndChildrenWindows(_webApiProcess.Id);
#else
            KillProcessAndChildrenUnix(_webApiProcess.Id);
#endif
            _webApiProcess.Dispose();
        }
    }

    public void StopBlazorWasm()
    {
        if (!_blazorWasmProcess.HasExited)
        {
#if WINDOWS
            KillProcessAndChildrenWindows(_blazorWasmProcess.Id);
#else
            KillProcessAndChildrenUnix(_blazorWasmProcess.Id);
#endif
            _blazorWasmProcess.Dispose();
        }
    }

#if WINDOWS
    private void KillProcessAndChildrenWindows(int pid)
    {
        var searcher = new ManagementObjectSearcher($"Select * From Win32_Process Where ParentProcessID={pid}");
        var managementObjects = searcher.Get();

        foreach (var obj in managementObjects)
        {
            int childProcessId = Convert.ToInt32(obj["ProcessID"]);
            KillProcessAndChildrenWindows(childProcessId);
        }

        try
        {
            Process process = Process.GetProcessById(pid);
            process.Kill();
        }
        catch (ArgumentException)
        {
            // Process already exited.
        }
    }
#else
    private void KillProcessAndChildrenUnix(int pid)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "pkill",
                Arguments = $"-TERM -P {pid}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var pkillProcess = new Process
            {
                StartInfo = startInfo
            };

            pkillProcess.Start();
            pkillProcess.WaitForExit();
        }
        catch (Exception ex)
        {
            // Handle exception
        }

        try
        {
            Process process = Process.GetProcessById(pid);
            process.Kill();
        }
        catch (ArgumentException)
        {
            // Process already exited.
        }
    }
#endif
}
