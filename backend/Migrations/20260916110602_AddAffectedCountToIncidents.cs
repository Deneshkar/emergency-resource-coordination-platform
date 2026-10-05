using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ERCP.Api.Migrations
{
    public partial class AddAffectedCountToIncidents : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new columns to Incidents
            migrationBuilder.AddColumn<int>(
                name: "AffectedCount",
                table: "Incidents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AssignedCoordinator",
                table: "Incidents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Incidents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Incidents",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Incidents",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReporterContact",
                table: "Incidents",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Add new columns to IncidentPlans
            migrationBuilder.AddColumn<string>(
                name: "ActionStepsJson",
                table: "IncidentPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "IncidentPlans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApprovedBy",
                table: "IncidentPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EstimatedResourcesJson",
                table: "IncidentPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Phase",
                table: "IncidentPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RiskAssessment",
                table: "IncidentPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Create IncidentTimelineEvents table
            migrationBuilder.CreateTable(
                name: "IncidentTimelineEvents",
                columns: table => new
                {
                    Id = table.Column<int>(
                            type: "integer",
                            nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),

                    IncidentId = table.Column<int>(
                        type: "integer",
                        nullable: false),

                    EventType = table.Column<string>(
                        type: "text",
                        nullable: false),

                    Title = table.Column<string>(
                        type: "text",
                        nullable: false),

                    Description = table.Column<string>(
                        type: "text",
                        nullable: false),

                    CreatedBy = table.Column<string>(
                        type: "text",
                        nullable: false),

                    Timestamp = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_IncidentTimelineEvents",
                        x => x.Id);

                    table.ForeignKey(
                        name: "FK_IncidentTimelineEvents_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Index for IncidentTimelineEvents
            migrationBuilder.CreateIndex(
                name: "IX_IncidentTimelineEvents_IncidentId",
                table: "IncidentTimelineEvents",
                column: "IncidentId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove IncidentTimelineEvents
            migrationBuilder.DropTable(
                name: "IncidentTimelineEvents");

            // Remove Incidents columns
            migrationBuilder.DropColumn(
                name: "AffectedCount",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "AssignedCoordinator",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReporterContact",
                table: "Incidents");

            // Remove IncidentPlans columns
            migrationBuilder.DropColumn(
                name: "ActionStepsJson",
                table: "IncidentPlans");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "IncidentPlans");

            migrationBuilder.DropColumn(
                name: "ApprovedBy",
                table: "IncidentPlans");

            migrationBuilder.DropColumn(
                name: "EstimatedResourcesJson",
                table: "IncidentPlans");

            migrationBuilder.DropColumn(
                name: "Phase",
                table: "IncidentPlans");

            migrationBuilder.DropColumn(
                name: "RiskAssessment",
                table: "IncidentPlans");
        }
    }
}