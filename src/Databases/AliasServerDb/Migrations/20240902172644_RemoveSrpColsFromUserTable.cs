using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AliasServerDb.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSrpColsFromUserTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Salt",
                table: "AliasVaultUsers");

            migrationBuilder.DropColumn(
                name: "Verifier",
                table: "AliasVaultUsers");

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordChangedAt",
                table: "AliasVaultUsers",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordChangedAt",
                table: "AliasVaultUsers");

            migrationBuilder.AddColumn<string>(
                name: "Salt",
                table: "AliasVaultUsers",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Verifier",
                table: "AliasVaultUsers",
                type: "TEXT",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");
        }
    }
}
