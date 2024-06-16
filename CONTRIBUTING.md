# Contributing
This document is a work-in-progress and will be expanded as time goes on. If you have any questions feel free to open a issue on GitHub.

Note: all instructions below are based on MacOS. If you are using a different operating system, you may need to adjust the commands accordingly.

## Getting Started
In order to contribute to this project, you will need to have the following tools installed on your machine:

- Make sure to install the latest version of .NET SDK 8:

```bash
# Install .NET SDK 8

# On MacOS via brew: 
brew install --cask dotnet-sdk

# On Windows via winget
winget install Microsoft.DotNet.SDK.8
```

- Dotnet CLI EF Tools

```bash
# Install dotnet EF tools globally
dotnet tool install --global dotnet-ef
# Include dotnet tools in your PATH
nano ~/.zshrc
# Add the following line to your .zshrc file
export PATH="$PATH:$HOME/.dotnet/tools"
# Start a new terminal and test that this command works:
dotnet ef
```

- Run Tailwind CSS compiler while changing HTML files

```bash
npm run build:css
```

- Install Playwright locally in order to run NUnit E2E (end-to-end) tests

```bash
# First install PowerShell for Mac (if you don't have it already)
brew install powershell/tap/powershell
# Install Playwright
dotnet tool install --global Microsoft.Playwright.CLI
# Run Playwright install script to download local browsers
# Note: make sure the E2E test project has been built at least once so the bin dir exists.
pwsh src/Tests/AliasVault.E2ETests/bin/Debug/net8.0/playwright.ps1 install
```
