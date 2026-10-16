using System;
using ERCP.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERCP.Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261016000000_AddWorkflowExecution")]
public partial class AddWorkflowExecution : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "WorkflowExecutions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                IncidentId = table.Column<int>(type: "integer", nullable: false),
                IncidentPlanId = table.Column<int>(type: "integer", nullable: true),
                DispatchId = table.Column<int>(type: "integer", nullable: true),
                Objective = table.Column<string>(type: "text", nullable: false),
                Status = table.Column<string>(type: "text", nullable: false),
                ApprovalStatus = table.Column<string>(type: "text", nullable: false),
                PlanJson = table.Column<string>(type: "text", nullable: false),
                CompletedStepsJson = table.Column<string>(type: "text", nullable: false),
                ToolResultsJson = table.Column<string>(type: "text", nullable: false),
                ValidationJson = table.Column<string>(type: "text", nullable: false),
                ErrorsJson = table.Column<string>(type: "text", nullable: false),
                FinalOutcome = table.Column<string>(type: "text", nullable: false),
                ApprovedBy = table.Column<string>(type: "text", nullable: true),
                ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_WorkflowExecutions", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_WorkflowExecutions_IncidentId",
            table: "WorkflowExecutions", column: "IncidentId");
        migrationBuilder.CreateIndex(name: "IX_WorkflowExecutions_DispatchId",
            table: "WorkflowExecutions", column: "DispatchId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropTable(name: "WorkflowExecutions");
}
