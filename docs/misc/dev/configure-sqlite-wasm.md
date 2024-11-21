---
layout: default
title: Configure SQLite for use with WebAssembly
parent: Development
grand_parent: Miscellaneous
nav_order: 2
---

# Configure SQLite for use with WebAssembly
To configure SQLite for use with WebAssembly follow these steps:

1. Add NuGet package
```
dotnet add package SQLitePCLRaw.bundle_e_sqlite3
```

2. Modify .csproj and add the following:
```xml
    <PropertyGroup>
        <WasmBuildNative>true</WasmBuildNative>
    </PropertyGroup>
```

3. Make sure the "wasm-tools" workload is installed on the local machine in order to build the project:
```
dotnet workload install wasm-tools
```
