﻿// <auto-generated/>
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AliasClientDb.Migrations
{
    /// <inheritdoc />
    public partial class _100InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Aliases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Gender = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    FirstName = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    LastName = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    NickName = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    BirthDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AddressStreet = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    AddressCity = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    AddressState = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    AddressZipCode = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    AddressCountry = table.Column<string>(type: "VARCHAR", maxLength: 255, nullable: true),
                    Hobbies = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    EmailPrefix = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    PhoneMobile = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    BankAccountIBAN = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aliases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Services",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    Url = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    Logo = table.Column<byte[]>(type: "BLOB", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Services", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Credentials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AliasId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ServiceId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Credentials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Credentials_Aliases_AliasId",
                        column: x => x.AliasId,
                        principalTable: "Aliases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Credentials_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Attachment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Filename = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Blob = table.Column<byte[]>(type: "BLOB", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CredentialId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attachment_Credentials_CredentialId",
                        column: x => x.CredentialId,
                        principalTable: "Credentials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Passwords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CredentialId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passwords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Passwords_Credentials_CredentialId",
                        column: x => x.CredentialId,
                        principalTable: "Credentials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_CredentialId",
                table: "Attachment",
                column: "CredentialId");

            migrationBuilder.CreateIndex(
                name: "IX_Credentials_AliasId",
                table: "Credentials",
                column: "AliasId");

            migrationBuilder.CreateIndex(
                name: "IX_Credentials_ServiceId",
                table: "Credentials",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Passwords_CredentialId",
                table: "Passwords",
                column: "CredentialId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attachment");

            migrationBuilder.DropTable(
                name: "Passwords");

            migrationBuilder.DropTable(
                name: "Credentials");

            migrationBuilder.DropTable(
                name: "Aliases");

            migrationBuilder.DropTable(
                name: "Services");
        }
    }
}