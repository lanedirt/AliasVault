using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AliasDb.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceLogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "Logo",
                table: "Services",
                type: "BLOB",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "Services",
                type: "TEXT",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Logo",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "Services");
        }
    }
}
