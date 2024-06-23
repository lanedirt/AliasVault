//-----------------------------------------------------------------------
// <copyright file="ReplaceTextTask.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace BuildTasks;

using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;
using System.IO;

/// <summary>
/// Custom task that can be called from MSBuild to replace text in a file.
/// This is used for updating version number and cache buster vars in files during
/// build of WASM app project.
/// </summary>
public class ReplaceTextTask : Task
{
    [Required]
    public string InputFile { get; set; } = null!;

    [Required]
    public string OutputFile { get; set; } = null!;

    [Required]
    public string CacheBuster { get; set; } = null!;

    [Required]
    public string BuildVersion { get; set; } = null!;

    public override bool Execute()
    {
        try
        {
            string content = File.ReadAllText(InputFile);
            content = content.Replace("@CacheBuster", CacheBuster)
                .Replace("@BuildVersion", BuildVersion);
            File.WriteAllText(OutputFile, content);
            return true;
        }
        catch (Exception ex)
        {
            Log.LogErrorFromException(ex);
            return false;
        }
    }
}
