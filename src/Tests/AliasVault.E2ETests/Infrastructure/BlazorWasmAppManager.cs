//-----------------------------------------------------------------------
// <copyright file="BlazorWasmAppManager.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasVault.E2ETests.Infrastructure;

using System.Diagnostics;
using System.Net;

/// <summary>
/// A class for managing the Blazor WebAssembly application in out-of-process mode for E2E testing.
/// </summary>
public class BlazorWasmAppManager
{
    private readonly List<string> _blazorWasmErrors = [];
    private Process? _blazorWasmProcess;

    /// <summary>
    /// Starts the Blazor WebAssembly application in out-of-process mode.
    /// </summary>
    /// <param name="port">The port number to run the app under.</param>
    /// <returns>Async task.</returns>
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
            },
        };

        _blazorWasmProcess.OutputDataReceived += (sender, args) =>
        {
            TestContext.Out.WriteLine(args.Data);
        };
        _blazorWasmProcess.ErrorDataReceived += (sender, args) =>
        {
            if (args.Data is null)
            {
                return;
            }

            TestContext.Out.WriteLine(args.Data);
            _blazorWasmErrors.Add(args.Data);
        };

        _blazorWasmProcess.Start();
        _blazorWasmProcess.BeginOutputReadLine();
        _blazorWasmProcess.BeginErrorReadLine();

        await WaitForStartupAsync(port);
    }

    /// <summary>
    /// Stops the Blazor WebAssembly application process.
    /// </summary>
    public void StopBlazorWasm()
    {
        if (_blazorWasmProcess is not null && !_blazorWasmProcess.HasExited)
        {
#if WINDOWS
            KillProcessAndChildrenWindows(_blazorWasmProcess.Id);
#else
            KillProcessAndChildrenUnix(_blazorWasmProcess.Id);
#endif
            _blazorWasmProcess.Dispose();
        }
    }

    private string GetBaseDirectory()
    {
        string currentDir = Directory.GetCurrentDirectory();
        string baseDir = string.Empty;
        var parentDir = Directory.GetParent(currentDir);
        if (parentDir?.Parent?.Parent != null)
        {
            baseDir = parentDir.Parent.Parent.FullName;
        }

        return baseDir;
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
            }
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
                CreateNoWindow = true,
            };

            var pkillProcess = new Process
            {
                StartInfo = startInfo,
            };

            pkillProcess.Start();
            pkillProcess.WaitForExit();
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }

        try
        {
            Process process = Process.GetProcessById(pid);
            process.Kill();
        }
        catch (ArgumentException e)
        {
            Console.WriteLine(e.Message);
        }
    }
#endif
}
