using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERCP.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddValidationLlmFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiInsight",
                table: "ValidationAudits",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LlmEnhanced",
                table: "ValidationAudits",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiInsight",
                table: "ValidationAudits");

            migrationBuilder.DropColumn(
                name: "LlmEnhanced",
                table: "ValidationAudits");
        }
    }
}
