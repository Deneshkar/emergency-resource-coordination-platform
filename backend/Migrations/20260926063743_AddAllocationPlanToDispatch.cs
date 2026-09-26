using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERCP.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAllocationPlanToDispatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AllocationPlanId",
                table: "Dispatches",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Dispatches_AllocationPlanId",
                table: "Dispatches",
                column: "AllocationPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Dispatches_IncidentPlans_AllocationPlanId",
                table: "Dispatches",
                column: "AllocationPlanId",
                principalTable: "IncidentPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Dispatches_IncidentPlans_AllocationPlanId",
                table: "Dispatches");

            migrationBuilder.DropIndex(
                name: "IX_Dispatches_AllocationPlanId",
                table: "Dispatches");

            migrationBuilder.DropColumn(
                name: "AllocationPlanId",
                table: "Dispatches");
        }
    }
}
