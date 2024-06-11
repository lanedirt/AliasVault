namespace AliasVault.E2ETests;

using System.Diagnostics;
using System.Net;

public class WebAppManager
{
    private Process _blazorWasmProcess;
    private List<string> _blazorWasmErrors = new();

    private string GetBaseDirectory()
    {
        string currentDir = Directory.GetCurrentDirectory();
        // Adjust this if your solution directory is different
        string baseDir = Directory.GetParent(currentDir).Parent.Parent.FullName;
        return baseDir;
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

        _blazorWasmProcess.OutputDataReceived += (sender, args) =>
        {
            TestContext.Out.WriteLine(args.Data);
        };
        _blazorWasmProcess.ErrorDataReceived += (sender, args) =>
        {
            TestContext.Out.WriteLine(args.Data);
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
                if (_blazorWasmErrors.Count > 0)
                {
                    Assert.Fail($"WASM failed to start: {string.Join(Environment.NewLine, _blazorWasmErrors)}");
                    return;
                }

                Console.WriteLine(e.Message);
                await Task.Delay(500);
            }
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
