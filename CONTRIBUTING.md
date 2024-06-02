# Contributing
This document is a work-in-progress and will be expanded as time goes on. If you have any questions feel free to open a issue on GitHub.

Note: all instructions below are based on MacOS. If you are using a different operating system, you may need to adjust the commands accordingly.

## Getting Started
In order to contribute to this project, you will need to have the following tools installed on your machine:

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

