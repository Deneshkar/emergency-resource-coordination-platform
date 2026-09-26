using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERCP.Api.Migrations
{
    public partial class UnifyDispatchTaskResourceId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResourceId",
                table: "DispatchTasks");

            migrationBuilder.AddColumn<int>(
                name: "ResourceId",
                table: "DispatchTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DispatchTasks_ResourceId",
                table: "DispatchTasks",
                column: "ResourceId");

            migrationBuilder.AddForeignKey(
                name: "FK_DispatchTasks_Resources_ResourceId",
                table: "DispatchTasks",
                column: "ResourceId",
                principalTable: "Resources",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DispatchTasks_Resources_ResourceId",
                table: "DispatchTasks");

            migrationBuilder.DropIndex(
                name: "IX_DispatchTasks_ResourceId",
                table: "DispatchTasks");

            migrationBuilder.DropColumn(
                name: "ResourceId",
                table: "DispatchTasks");

            migrationBuilder.AddColumn<Guid>(
                name: "ResourceId",
                table: "DispatchTasks",
                type: "uuid",
                nullable: true);
        }
    }
}