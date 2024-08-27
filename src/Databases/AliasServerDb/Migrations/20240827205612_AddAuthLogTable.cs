using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AliasServerDb.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthLogTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuthLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    EventType = table.Column<int>(type: "INTEGER", nullable: false),
                    IsSuccess = table.Column<bool>(type: "INTEGER", nullable: false),
                    FailureReason = table.Column<int>(type: "INTEGER", nullable: true),
                    IpAddress = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    DeviceType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    OperatingSystem = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Browser = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    AdditionalInfo = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    RequestPath = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsSuspiciousActivity = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventType",
                table: "AuthLogs",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_IpAddress",
                table: "AuthLogs",
                column: "IpAddress");

            migrationBuilder.CreateIndex(
                name: "IX_Timestamp",
                table: "AuthLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_Username_IsSuccess_Timestamp",
                table: "AuthLogs",
                columns: new[] { "Username", "IsSuccess", "Timestamp" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_Username_Timestamp",
                table: "AuthLogs",
                columns: new[] { "Username", "Timestamp" },
                descending: new[] { false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuthLogs");
        }
    }
}
