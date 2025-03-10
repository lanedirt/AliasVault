﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AliasServerDb.Migrations.SqliteMigrations
{
    /// <inheritdoc />
    public partial class WorkerStatusTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkerServiceStatuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServiceName = table.Column<string>(type: "varchar", maxLength: 255, nullable: false),
                    CurrentStatus = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DesiredStatus = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Heartbeat = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkerServiceStatuses", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkerServiceStatuses");
        }
    }
}
