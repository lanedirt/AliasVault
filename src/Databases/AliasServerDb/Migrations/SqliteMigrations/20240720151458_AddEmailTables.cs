﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AliasServerDb.Migrations.SqliteMigrations
{
    /// <inheritdoc />
    public partial class AddEmailTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Emails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Subject = table.Column<string>(type: "TEXT", nullable: false),
                    From = table.Column<string>(type: "TEXT", nullable: false),
                    FromLocal = table.Column<string>(type: "TEXT", nullable: false),
                    FromDomain = table.Column<string>(type: "TEXT", nullable: false),
                    To = table.Column<string>(type: "TEXT", nullable: false),
                    ToLocal = table.Column<string>(type: "TEXT", nullable: false),
                    ToDomain = table.Column<string>(type: "TEXT", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DateSystem = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MessageHtml = table.Column<string>(type: "TEXT", nullable: true),
                    MessagePlain = table.Column<string>(type: "TEXT", nullable: true),
                    MessagePreview = table.Column<string>(type: "TEXT", nullable: true),
                    MessageSource = table.Column<string>(type: "TEXT", nullable: false),
                    Visible = table.Column<bool>(type: "INTEGER", nullable: false),
                    PushNotificationSent = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Emails", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Bytes = table.Column<byte[]>(type: "BLOB", nullable: false),
                    Filename = table.Column<string>(type: "TEXT", nullable: false),
                    MimeType = table.Column<string>(type: "TEXT", nullable: false),
                    Filesize = table.Column<int>(type: "INTEGER", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EmailId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailAttachments_Emails_EmailId",
                        column: x => x.EmailId,
                        principalTable: "Emails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailAttachments_EmailId",
                table: "EmailAttachments",
                column: "EmailId");

            migrationBuilder.CreateIndex(
                name: "IX_Emails_Date",
                table: "Emails",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Emails_DateSystem",
                table: "Emails",
                column: "DateSystem");

            migrationBuilder.CreateIndex(
                name: "IX_Emails_PushNotificationSent",
                table: "Emails",
                column: "PushNotificationSent");

            migrationBuilder.CreateIndex(
                name: "IX_Emails_ToLocal",
                table: "Emails",
                column: "ToLocal");

            migrationBuilder.CreateIndex(
                name: "IX_Emails_Visible",
                table: "Emails",
                column: "Visible");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailAttachments");

            migrationBuilder.DropTable(
                name: "Emails");
        }
    }
}
