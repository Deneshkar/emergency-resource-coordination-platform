using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace ERCP.Api.Migrations
{
    /// <inheritdoc />
    public partial class CompleteAuthenticationAndPlanningSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // These objects existed in the snapshot/startup repair SQL but not the migration chain.
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Skills = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_Users", x => x.Id));
            migrationBuilder.CreateIndex("IX_Users_Email", "Users", "Email", unique: true);

            migrationBuilder.CreateTable(
                name: "ValidationAudits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DispatchId = table.Column<int>(type: "integer", nullable: false),
                    IncidentId = table.Column<int>(type: "integer", nullable: true),
                    IsValid = table.Column<bool>(type: "boolean", nullable: false),
                    Recommendation = table.Column<string>(type: "text", nullable: false),
                    ViolationsJson = table.Column<string>(type: "text", nullable: false),
                    WarningsJson = table.Column<string>(type: "text", nullable: false),
                    ChecksJson = table.Column<string>(type: "text", nullable: false),
                    ValidatedBy = table.Column<string>(type: "text", nullable: false),
                    DurationMs = table.Column<long>(type: "bigint", nullable: false),
                    ValidatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ValidationAudits", x => x.Id);
                    table.ForeignKey("FK_ValidationAudits_Dispatches_DispatchId", x => x.DispatchId,
                        "Dispatches", "Id", onDelete: ReferentialAction.Cascade);
                });
            migrationBuilder.CreateIndex("IX_ValidationAudits_DispatchId", "ValidationAudits", "DispatchId");

            migrationBuilder.AddColumn<string>("Reasoning", "IncidentPlans", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>("RisksJson", "IncidentPlans", type: "text", nullable: false, defaultValue: "[]");
            migrationBuilder.AddColumn<string>("ConstraintsJson", "IncidentPlans", type: "text", nullable: false, defaultValue: "[]");
            migrationBuilder.AddColumn<bool>("RequiresHumanApproval", "IncidentPlans", type: "boolean", nullable: false, defaultValue: true);
            migrationBuilder.AddColumn<string>("SuggestedAssignmentsJson", "IncidentPlans", type: "text", nullable: false, defaultValue: "[]");
            migrationBuilder.AddColumn<string>("DispatchPlanJson", "IncidentPlans", type: "text", nullable: false, defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("ValidationAudits");
            migrationBuilder.DropTable("Users");
            migrationBuilder.DropColumn("Reasoning", "IncidentPlans");
            migrationBuilder.DropColumn("RisksJson", "IncidentPlans");
            migrationBuilder.DropColumn("ConstraintsJson", "IncidentPlans");
            migrationBuilder.DropColumn("RequiresHumanApproval", "IncidentPlans");
            migrationBuilder.DropColumn("SuggestedAssignmentsJson", "IncidentPlans");
            migrationBuilder.DropColumn("DispatchPlanJson", "IncidentPlans");
        }
    }
}
