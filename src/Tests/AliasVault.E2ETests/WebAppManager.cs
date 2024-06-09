using System.Diagnostics;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using OSPlatform = NUnit.Framework.Internal.OSPlatform;

namespace AliasVault.E2ETests;

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

    private void KillExistingProcesses(string uniqueIdentifier)
    {
        var existingProcesses = Process.GetProcessesByName("dotnet")
            .Where(p => GetCommandLineArgs(p).Contains(uniqueIdentifier));

        foreach (var process in existingProcesses)
        {
            try
            {
                process.Kill();
                process.WaitForExit();
                TestContext.Progress.WriteLine($"Killed existing process with PID: {process.Id}");
            }
            catch (Exception ex)
            {
                TestContext.Progress.WriteLine($"Failed to kill process with PID: {process.Id}, Error: {ex.Message}");
            }
        }
    }

    private string GetCommandLineArgs(Process process)
    {
#if WINDOWS
        return GetCommandLineArgsWindows(process);
#else
        return GetCommandLineArgsUnix(process);
#endif
    }

    private string GetCommandLineArgsWindows(Process process)
    {
#if WINDOWS

        try
        {
            using (var searcher = new System.Management.ManagementObjectSearcher(
                $"SELECT CommandLine FROM Win32_Process WHERE ProcessId = {process.Id}"))
            using (var objects = searcher.Get())
            {
                return objects.Cast<System.Management.ManagementBaseObject>()
                              .SingleOrDefault()?["CommandLine"]?.ToString();
            }
        }
        catch
        {
            return string.Empty;
        }
#else
    return string.Empty;
#endif
    }

    private string GetCommandLineArgsUnix(Process process)
    {
        try
        {
            string path = $"/proc/{process.Id}/cmdline";
            return File.Exists(path) ? File.ReadAllText(path).Replace('\0', ' ') : string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    public async Task StartWebApiAsync(int port)
    {
        var projectPath = $"{GetBaseDirectory()}/../../AliasVault.Api/AliasVault.Api.csproj";
        KillExistingProcesses("AliasVaultWebApiIdentifier");

        _webApiProcess = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"run --project {projectPath} --urls=http://localhost:{port} AliasVaultWebApiIdentifier",
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
        KillExistingProcesses("AliasVaultWasmAppIdentifier");

        _blazorWasmProcess = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"run --project {projectPath} --urls=http://localhost:{port} AliasVaultWasmAppIdentifier",
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
        if (_webApiProcess != null && !_webApiProcess.HasExited)
        {
            _webApiProcess.Kill();
            _webApiProcess.Dispose();
        }
    }

    public void StopBlazorWasm()
    {
        if (_blazorWasmProcess != null && !_blazorWasmProcess.HasExited)
        {
            _blazorWasmProcess.Kill();
            _blazorWasmProcess.Dispose();
        }
    }
}
