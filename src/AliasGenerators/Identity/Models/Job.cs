//-----------------------------------------------------------------------
// <copyright file="Job.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------
namespace AliasGenerators.Identity.Models;

/// <summary>
/// Job model.
/// </summary>
public class Job
{
    /// <summary>
    /// Gets or sets the title.
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Gets or sets the company.
    /// </summary>
    public string Company { get; set; } = null!;

    /// <summary>
    /// Gets or sets the salary.
    /// </summary>
    public string Salary { get; set; } = null!;

    /// <summary>
    /// Gets or sets the calculated salary.
    /// </summary>
    public decimal SalaryCalculated { get; set; }

    /// <summary>
    /// Gets or sets the description.
    /// </summary>
    public string Description { get; set; } = null!;
}
