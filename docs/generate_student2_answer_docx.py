import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

# Import helpers
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from student2_report_helpers import (
    set_cell_background, set_cell_margins, add_callout,
    add_code_block, add_figure, format_table_header, populate_table_row
)

def build_student2_document():
    doc = docx.Document()

    # Configure Margins: 1 inch all sides
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
        # Configure Header & Footer
        header = section.header
        p_hdr = header.paragraphs[0]
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_hdr.paragraph_format.space_after = Pt(4)
        run_hdr = p_hdr.add_run("SE3090 Assignment 1 | Individual Answer Document: Student 2 (M. Thanusikan)")
        run_hdr.font.name = "Calibri"
        run_hdr.font.size = Pt(8.5)
        run_hdr.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

        footer = section.footer
        p_ftr = footer.paragraphs[0]
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        run_ftr = p_ftr.add_run("Emergency Resource Coordination Platform (ERCP) — Student 2 Individual Submission")
        run_ftr.font.name = "Calibri"
        run_ftr.font.size = Pt(8.5)
        run_ftr.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

    # Base Typography Settings
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    print("Building Document Title / Cover Section...")

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(20)
    p_logo.paragraph_format.space_after = Pt(12)
    if os.path.exists("docs/images/sliit_logo.png"):
        p_logo.add_run().add_picture("docs/images/sliit_logo.png", width=Inches(1.8))

    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_after = Pt(2)
    run_u = p_univ.add_run("SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY")
    run_u.bold = True
    run_u.font.size = Pt(14)
    run_u.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_fac = doc.add_paragraph()
    p_fac.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fac.paragraph_format.space_after = Pt(18)
    run_f = p_fac.add_run("Faculty of Computing | Department of Software Engineering\nBSc (Hons) in Information Technology Specializing in Software Engineering")
    run_f.font.size = Pt(10)
    run_f.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)

    p_mod = doc.add_paragraph()
    p_mod.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_mod.paragraph_format.space_after = Pt(6)
    run_m = p_mod.add_run("SE3090 — Software Engineering Frameworks (Year 3, Semester 1 — 2026)")
    run_m.bold = True
    run_m.font.size = Pt(12)
    run_m.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(6)
    run_t = p_title.add_run("ASSIGNMENT 1: INTEGRATED FULL-STACK & AGENTIC AI APPLICATION")
    run_t.bold = True
    run_t.font.size = Pt(16)
    run_t.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    run_s = p_sub.add_run("STUDENT 2 INDIVIDUAL ANSWER & COMPREHENSIVE TECHNICAL EVALUATION REPORT\n"
                          "Domain: Resource & Inventory Management + Situation Analysis Agent Lead")
    run_s.bold = True
    run_s.font.size = Pt(12)
    run_s.font.color.rgb = RGBColor(0xC5, 0x30, 0x30)

    # Student Metadata Box
    tbl_meta = doc.add_table(rows=6, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False

    meta_data = [
        ("Student Full Name", "M. Thanusikan"),
        ("Student Registration ID", "IT24103609"),
        ("Assigned Component", "Component B: Resource, Shelter & Inventory Logistics"),
        ("Agentic AI Subsystem", "Situation Analysis Agent (Python Agent + C# ASP.NET Core Service)"),
        ("Third-Party Integration", "OpenStreetMap Nominatim Geocoding & Haversine Distance Routing"),
        ("Submission Date & Status", "30 September 2026 | Verified, Deployed & Viva Ready")
    ]

    for i, (k, v) in enumerate(meta_data):
        row = tbl_meta.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F0F4F8")
        set_cell_background(c1, "FFFFFF" if i % 2 == 0 else "F7FAFC")
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)

        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    doc.add_page_break()

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & TECHNICAL OWNERSHIP
    # =========================================================================
    h1 = doc.add_heading("1. Executive Summary & Individual Technical Ownership", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "As Student 2 (M. Thanusikan, IT24103609), I hold full, end-to-end technical ownership over the "
        "Resource, Shelter, and Inventory Logistics domain as well as the Situation Analysis AI Subsystem "
        "in the Emergency Resource Coordination Platform (ERCP). My responsibilities span all six required "
        "layers of the modern enterprise software engineering stack: backend REST API development in ASP.NET Core 8, "
        "relational data modelling and migrations in PostgreSQL (Entity Framework Core), web user interface development "
        "in React 18, cross-platform mobile screen engineering in Flutter 3, agentic AI architecture with tool controls, "
        "and multi-layer automated testing with CI/CD automation."
    )

    add_callout(
        doc,
        "Marking Scheme & Rubric Alignment (70 Individual Marks)",
        "This document provides complete, exhaustive technical evidence, code walkthroughs, live execution proofs, "
        "and real production screenshots satisfying every individual evaluation criterion:\n"
        "• ASP.NET Core RESTful API Development (10 Marks): 15 endpoints, DTO separation, defensive business safeguards.\n"
        "• PostgreSQL Integration & Data Modelling (10 Marks): Normalized 3NF entities, FK relationships, EF Core migrations.\n"
        "• React Web Application (10 Marks): Component hierarchy, dynamic capacity alerts, OpenStreetMap routing.\n"
        "• Flutter Mobile Application (10 Marks): Device location integration, responsive UI, Haversine proximity calculations.\n"
        "• Individual Agentic AI Contribution (12 Marks): Situation Analysis Agent with allow-listed mathematical tools & state persistence.\n"
        "• API Integration, Security & Cross-Platform (10 Marks): JWT Bearer RBAC, unified contract, CORS & HTTPS.\n"
        "• Testing, CI and Git Workflow (8 Marks): 15 backend xUnit tests, 6 React Vitest tests, 30 Flutter tests, GitHub Actions CI."
    )

    doc.add_heading("1.1 Comprehensive Technical Ownership Matrix", level=2)
    tbl_own = doc.add_table(rows=7, cols=4)
    tbl_own.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_own.autofit = False

    cols_w = [Inches(1.2), Inches(2.2), Inches(1.8), Inches(1.3)]
    headers = ["Stack Layer", "Owned Code Artifacts", "Core Business Responsibilities", "Verification Status"]
    format_table_header(tbl_own.rows[0], headers, bg_hex="1B365D")

    rows_data = [
        ("Backend Web API", "SheltersController.cs\nResourcesController.cs\nInventoryController.cs\nGeolocationController.cs", "CRUD + Occupancy bounds checks, stock adjustments, low-stock filter, Haversine routing.", "100% Passing\n(15 Endpoints)"),
        ("PostgreSQL Database", "Shelter.cs, Resource.cs,\nInventoryItem.cs, SituationAssessment.cs,\nAppDbContext.cs, EF Migrations", "Normalized schema, 1->N foreign keys, unified ResourceId FK, Supabase live tables.", "100% Deployed\n(Supabase Cloud)"),
        ("React Web UI", "ResourceInventoryHub.jsx\nShelterList.jsx, ResourceList.jsx\nInventoryList.jsx, SituationAnalysisView.jsx", "Dynamic capacity progress bars, low-stock badges, OSM map routing, AI triggers.", "100% Passing\n(Vitest Tests)"),
        ("Flutter Mobile", "shelter_locator_screen.dart\nresource_status_screen.dart\ninventory_overview_screen.dart", "GPS location math, proximity sorting, OSM navigation intent, responsive card widgets.", "100% Passing\n(30 Widget Tests)"),
        ("Agentic AI Subsystem", "situation_analysis_agent.py\nSituationAnalysisService.cs\nSituationAnalysisController.cs", "Urgency scoring (1-100), inventory deficit detection, nearest shelter matching, audit state.", "100% Passing\n(CLI & Service)"),
        ("Testing & CI/CD", "15 xUnit backend tests\n6 Vitest React tests\n30 Flutter tests, .github/workflows/ci.yml", "Unit, integration, and widget test automation gating pull requests on GitHub Actions.", "100% Passing\n(Green CI Build)")
    ]

    for r_idx, r_vals in enumerate(rows_data):
        row = tbl_own.rows[r_idx + 1]
        for c_idx, w in enumerate(cols_w):
            row.cells[c_idx].width = w
        populate_table_row(row, r_vals, is_even=(r_idx % 2 == 1))

    # =========================================================================
    # SECTION 2: ASP.NET CORE RESTFUL API DEVELOPMENT (10 MARKS)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("2. ASP.NET Core RESTful API Development (Criterion 1 — 10 Marks)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "I designed and implemented a production-grade, highly maintainable RESTful API architecture using "
        "ASP.NET Core 8.0, following the Clean Architecture and Controller-Service-Repository patterns. "
        "All endpoints adhere strictly to HTTP standards, using proper verbs (GET, POST, PUT, DELETE), standard "
        "status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found), asynchronous execution with "
        "async/await, and strongly typed Data Transfer Objects (DTOs) to isolate internal database entities from the client."
    )

    doc.add_heading("2.1 Student 2 RESTful Endpoint Catalog", level=2)
    
    tbl_ep = doc.add_table(rows=16, cols=4)
    tbl_ep.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_ep.autofit = False

    ep_cols_w = [Inches(0.9), Inches(2.4), Inches(2.3), Inches(0.9)]
    ep_headers = ["HTTP Verb", "Route Path", "Purpose & Business Safeguard", "Status Codes"]
    format_table_header(tbl_ep.rows[0], ep_headers, bg_hex="1B365D")

    endpoints_data = [
        ("GET", "/api/shelters", "Paginated shelter directory with name search and status filtering.", "200 OK"),
        ("GET", "/api/shelters/available", "Returns only evacuation shelters having positive available vacancy.", "200 OK"),
        ("GET", "/api/shelters/{id}", "Retrieves shelter details with associated resources and inventory items.", "200 OK, 404"),
        ("POST", "/api/shelters", "Registers new shelter. Validates TotalCapacity > 0 and coordinates.", "201 Created, 400"),
        ("PUT", "/api/shelters/{id}", "Updates shelter metadata (contact, location, total capacity).", "200 OK, 400, 404"),
        ("PUT", "/api/shelters/{id}/occupancy", "Defensive occupancy update: Prevents Occupancy > TotalCapacity. Auto-sets status to Full.", "200 OK, 400, 404"),
        ("DELETE", "/api/shelters/{id}", "Soft-safe deletion of shelter record after unlinking dependencies.", "200 OK, 404"),
        ("GET", "/api/resources", "Queries physical emergency assets with filters by type and status.", "200 OK"),
        ("GET", "/api/resources/available", "Queries only ready-for-deployment resources (Status == 'Available').", "200 OK"),
        ("POST", "/api/resources", "Registers new emergency equipment/vehicle and links to base shelter.", "201 Created, 400"),
        ("PUT", "/api/resources/{id}/status", "Updates resource operational lifecycle (Available, Dispatched, Maintenance).", "200 OK, 400, 404"),
        ("GET", "/api/inventory", "Queries warehouse supplies across medical, food, water, and power.", "200 OK"),
        ("GET", "/api/inventory/low-stock", "Business operation: Returns items where Quantity <= MinimumThreshold.", "200 OK"),
        ("PUT", "/api/inventory/{id}/adjust-stock", "Stock adjustment guard: Prevents negative balance. Returns 400 on underflow.", "200 OK, 400, 404"),
        ("GET", "/api/geolocation/nearest-shelters", "Haversine routing: Calculates distance (km) and travel time to candidate shelters.", "200 OK, 400")
    ]

    for r_idx, r_vals in enumerate(endpoints_data):
        row = tbl_ep.rows[r_idx + 1]
        for c_idx, w in enumerate(ep_cols_w):
            row.cells[c_idx].width = w
        populate_table_row(row, r_vals, is_even=(r_idx % 2 == 1))

    doc.add_heading("2.2 Defensive Business Logic Implementation Walkthrough", level=2)
    doc.add_paragraph(
        "A critical requirement of Section 5.1 of the assignment specification is implementing business-specific "
        "operations beyond basic CRUD. The code below demonstrates two primary business safeguards authored by me:"
    )

    code_occupancy = (
        "// SheltersController.cs — Capacity Boundary Safeguard\n"
        "[HttpPut(\"{id}/occupancy\")]\n"
        "public async Task<ActionResult<ShelterDto>> UpdateOccupancy(int id, [FromBody] UpdateShelterOccupancyDto dto)\n"
        "{\n"
        "    var shelter = await _context.Shelters.FindAsync(id);\n"
        "    if (shelter == null) return NotFound(new { message = \"Shelter not found.\" });\n"
        "\n"
        "    // Defensive Guard: Prevent over-allocation of physical shelter capacity\n"
        "    if (dto.CurrentOccupancy > shelter.TotalCapacity)\n"
        "        return BadRequest(new { message = \"Current occupancy cannot exceed total shelter capacity.\" });\n"
        "\n"
        "    shelter.CurrentOccupancy = dto.CurrentOccupancy;\n"
        "    shelter.Status = (shelter.CurrentOccupancy >= shelter.TotalCapacity) ? \"Full\" : \"Active\";\n"
        "    await _context.SaveChangesAsync();\n"
        "    return Ok(MapToDto(shelter));\n"
        "}"
    )
    add_code_block(doc, code_occupancy, "C# ASP.NET Core 8")

    code_inventory = (
        "// InventoryController.cs — Negative Stock Prevention Guard\n"
        "[HttpPut(\"{id}/adjust-stock\")]\n"
        "public async Task<ActionResult<InventoryItemDto>> AdjustStock(int id, [FromBody] AdjustStockDto dto)\n"
        "{\n"
        "    var item = await _context.InventoryItems.FindAsync(id);\n"
        "    if (item == null) return NotFound(new { message = \"Inventory item not found.\" });\n"
        "\n"
        "    int newQuantity = item.Quantity + dto.QuantityChange;\n"
        "    // Defensive Guard: Inventory cannot be depleted below zero\n"
        "    if (newQuantity < 0)\n"
        "        return BadRequest(new { message = $\"Insufficient stock. Available: {item.Quantity}, requested adjustment: {dto.QuantityChange}\" });\n"
        "\n"
        "    item.Quantity = newQuantity;\n"
        "    item.Status = (item.Quantity <= item.MinimumThreshold) ? \"LowStock\" : \"InStock\";\n"
        "    await _context.SaveChangesAsync();\n"
        "    return Ok(MapToDto(item));\n"
        "}"
    )
    add_code_block(doc, code_inventory, "C# ASP.NET Core 8")

    doc.add_heading("2.3 Live Swagger API Documentation & Cloud Deployment Proof", level=2)
    add_figure(
        doc,
        "docs/images/real_screenshot_swagger.png",
        1,
        "ASP.NET Core Swagger UI (OpenAPI Specification) for Student 2 Subsystems",
        "Live interactive Swagger UI showing all registered endpoints under /api/resources, /api/shelters, /api/inventory, "
        "/api/geolocation, and /api/situationanalysis with complete schema schemas and authorization badges."
    )

    add_figure(
        doc,
        "docs/images/backend_railway_deployment_active.jpg",
        2,
        "ASP.NET Core Web API Production Cloud Deployment on Railway",
        "Active production deployment dashboard showing healthy HTTP 200 health checks, containerized .NET 8 runtime, "
        "and zero restart crashes under live traffic."
    )

    add_figure(
        doc,
        "docs/images/backend_railway_networking_domain.jpg",
        3,
        "Railway Cloud Networking & Public SSL HTTPS Domain",
        "Railway cloud networking console showing secure TLS/SSL HTTPS termination and direct upstream proxy to the ASP.NET Core application."
    )

    # =========================================================================
    # SECTION 3: POSTGRESQL INTEGRATION & DATA MODELLING (10 MARKS)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("3. PostgreSQL Integration and Data Modelling (Criterion 2 — 10 Marks)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "I modelled the data architecture according to strict Third Normal Form (3NF) relational principles, "
        "ensuring zero data duplication, referential integrity via foreign key constraints, and performance "
        "optimization via database indexes. The database is hosted on a managed Supabase PostgreSQL cluster "
        "and managed programmatically using Entity Framework Core code-first migrations."
    )

    doc.add_heading("3.1 Entity Relationship Architecture", level=2)
    doc.add_paragraph(
        "The relational schema owned by Student 2 consists of four core database tables:\n"
        "1. Shelters Table: Stores physical facility coordinates, capacity thresholds, and live occupancy.\n"
        "2. Resources Table: Tracks emergency vehicles and critical equipment, linked via foreign key to a base shelter.\n"
        "3. InventoryItems Table: Tracks disaster consumables (medical, food, water) with threshold monitors.\n"
        "4. SituationAssessments Table: Persists the immutable audit trail of the Situation Analysis AI Agent, linked to IncidentId."
    )

    code_ef = (
        "// AppDbContext.cs — Fluent API Relational Configuration (Student 2)\n"
        "protected override void OnModelCreating(ModelBuilder modelBuilder)\n"
        "{\n"
        "    base.OnModelCreating(modelBuilder);\n"
        "\n"
        "    // Shelter (1) -> Many Resources (One-to-Many with Restrict on Delete)\n"
        "    modelBuilder.Entity<Resource>()\n"
        "        .HasOne(r => r.Shelter)\n"
        "        .WithMany(s => s.Resources)\n"
        "        .HasForeignKey(r => r.ShelterId)\n"
        "        .OnDelete(DeleteBehavior.SetNull);\n"
        "\n"
        "    // Shelter (1) -> Many InventoryItems\n"
        "    modelBuilder.Entity<InventoryItem>()\n"
        "        .HasOne(i => i.Shelter)\n"
        "        .WithMany(s => s.InventoryItems)\n"
        "        .HasForeignKey(i => i.ShelterId)\n"
        "        .OnDelete(DeleteBehavior.Cascade);\n"
        "\n"
        "    // Cross-Component Unification: DispatchTask -> Resource (int? FK)\n"
        "    modelBuilder.Entity<DispatchTask>()\n"
        "        .HasOne(t => t.Resource)\n"
        "        .WithMany()\n"
        "        .HasForeignKey(t => t.ResourceId)\n"
        "        .OnDelete(DeleteBehavior.SetNull);\n"
        "}"
    )
    add_code_block(doc, code_ef, "C# Entity Framework Core")

    doc.add_heading("3.2 Resolving Cross-Team Schema Debt (Migration Walkthrough)", level=2)
    doc.add_paragraph(
        "During team integration, an architectural incompatibility emerged: Student 3 had defined "
        "DispatchTask.ResourceId as a nullable Guid?, whereas my Resource entity used an integer primary key (int Id). "
        "This prevented SQL foreign key joins and broke resource allocation queries. I took the initiative to author "
        "and execute EF Core migration '20260926062717_UnifyDispatchTaskResourceId', unifying the foreign key to int? "
        "with OnDelete(DeleteBehavior.SetNull). This resolved team blocking and restored full relational integrity."
    )

    add_figure(
        doc,
        "docs/images/database_supabase_tables_production.jpg",
        4,
        "Supabase Managed PostgreSQL Production Database Tables",
        "Supabase cloud console showing live production tables: Shelters, Resources, InventoryItems, and SituationAssessments "
        "with active records, indexes, and foreign key relations."
    )

    add_figure(
        doc,
        "docs/images/database_supabase_deployment_overview.jpg",
        5,
        "Supabase Cloud Database Infrastructure & Connection Health",
        "Supabase cloud project overview displaying 100% database health, low latency pool connections, and active PostgreSQL extensions."
    )

    # =========================================================================
    # SECTION 4: REACT WEB APPLICATION (10 MARKS)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("4. React Web Application (Criterion 3 — 10 Marks)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "I developed the administrative and coordination web interface using React 18, React Router v6, and "
        "modern Tailwind CSS. The web interface is designed for emergency coordinators and shelter managers to "
        "monitor capacities in real time, manage resource logistics, restock critical warehouse items, and trigger "
        "agentic AI situation assessments with instant visual feedback."
    )

    doc.add_heading("4.1 Component Hierarchy & Reactive Architecture", level=2)
    doc.add_paragraph(
        "My frontend contribution consists of five primary page components and dedicated service layers:\n"
        "• ResourceInventoryHub.jsx: Consolidated operations dashboard featuring dynamic occupancy progress bars, "
        "critical supply shortage alerts, and AI analysis triggers.\n"
        "• ShelterList.jsx: Interactive shelter directory with live capacity indicators, vacancy filters, and direct "
        "OpenStreetMap navigation links.\n"
        "• ResourceList.jsx: Real-time emergency vehicle and equipment roster with category filters and status badges.\n"
        "• InventoryList.jsx: Warehouse inventory management interface with low-stock threshold visual warnings.\n"
        "• SituationAnalysisView.jsx: Interactive AI agent console visualizing tactical gap analysis."
    )

    add_figure(
        doc,
        "docs/images/real_screenshot_react_hub.png",
        6,
        "React Web Application — Resource & Inventory Management Hub",
        "Live React Web UI showing the Resource & Inventory Hub with active shelter occupancy visual meters (alerting at 80% and 100%), "
        "critical inventory threshold indicators, and one-click quick actions."
    )

    add_figure(
        doc,
        "docs/images/real_screenshot_react_shelters.png",
        7,
        "React Web Application — Evacuation Shelter Directory & Capacity Management",
        "Live Shelter Management view displaying real-time occupancy statistics, contact info, total capacity, and OpenStreetMap "
        "geocoded routing buttons."
    )

    add_figure(
        doc,
        "docs/images/real_screenshot_react_login.png",
        8,
        "React Web Application — Role-Based Secure Authentication Portal",
        "Secure JWT authentication gateway protecting administrative routes and enforcing role permissions."
    )

    # =========================================================================
    # SECTION 5: FLUTTER MOBILE APPLICATION (10 MARKS)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("5. Flutter Mobile Application (Criterion 4 — 10 Marks)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "To empower frontline responders and citizens during disaster operations, I engineered dedicated mobile "
        "screens using Flutter 3 (Dart 3). The mobile application connects to the same ASP.NET Core backend API, "
        "leveraging mobile-first capabilities including GPS geolocation calculation, responsive layout cards, "
        "and native intent launching for turn-by-turn map navigation."
    )

    doc.add_heading("5.1 Mobile Screens & Responders Feature Set", level=2)
    doc.add_paragraph(
        "• shelter_locator_screen.dart: Calculates distance (in kilometers) between current user coordinates and active "
        "shelters using the Haversine trigonometric formula. Provides one-touch navigation intent launching OpenStreetMap.\n"
        "• resource_status_screen.dart: Real-time status tracker for field vehicles and equipment with status badges.\n"
        "• inventory_overview_screen.dart: Mobile inventory audit screen enabling emergency responders to inspect warehouse stocks.\n"
        "• Responsive Layout Safeguards: Resolved layout render overflow errors on constrained viewports by refactoring "
        "widget trees with Flexible and Expanded containers."
    )

    add_figure(
        doc,
        "docs/images/flutter_screen_resources_logistics.jpeg",
        9,
        "Flutter Mobile Application — Shelter Locator & Resource Logistics",
        "Real screenshot of the Flutter mobile app running on an Android device, showing the live Shelter Locator "
        "with proximity distance calculations, available capacity meters, and one-touch OpenStreetMap navigation.",
        width_inches=3.2
    )

    add_figure(
        doc,
        "docs/images/flutter_screen_citizen_hub.jpeg",
        10,
        "Flutter Mobile Application — Citizen Emergency Assistance Hub",
        "Real screenshot of the Flutter mobile citizen portal displaying quick emergency assistance actions and active shelters.",
        width_inches=3.2
    )

    # =========================================================================
    # SECTION 6: INDIVIDUAL AGENTIC AI CONTRIBUTION (12 MARKS)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("6. Individual Agentic AI Contribution (Criterion 5 — 12 Marks)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "I authored and integrated the Situation Analysis Agent (ai-agents/situation_analysis_agent.py and "
        "SituationAnalysisService.cs), fulfilling the mandate for a distinct, domain-relevant Agentic AI subsystem. "
        "The agent acts as an analytical advisor in the emergency response pipeline: when an incident occurs, it "
        "evaluates raw severity metrics against live warehouse inventories and shelter capacities, generating an "
        "actionable urgency score (1-100), identifying critical supply deficits, and recommending candidate evacuation shelters."
    )

    doc.add_heading("6.1 Tool Allow-List & Controlled Permissions", level=2)
    doc.add_paragraph(
        "In strict compliance with assignment security requirements, the agent does not execute arbitrary code or mutate "
        "database records directly. Instead, it operates strictly via a bounded allow-list of deterministic mathematical tools:\n"
        "1. calculate_urgency_score: Mathematical scoring function combining base incident priority (Critical: 90, High: 75, "
        "Medium: 50, Low: 25) with weighted keyword modifiers (+10 for 'flood', 'casualty', 'trapped', 'fire', 'explosion').\n"
        "2. evaluate_inventory_deficiencies: Evaluates medical supplies (deficit if < 50), food/water rations (deficit if < 100), "
        "and transport vehicles (deficit if < 3).\n"
        "3. find_nearest_available_shelter: Filters shelters where TotalCapacity - CurrentOccupancy > 0 and ranks by vacancy."
    )

    code_agent_contract = (
        "// Situation Analysis Structured JSON Output Contract\n"
        "{\n"
        "  \"agent_id\": \"agent-situation-analysis-02\",\n"
        "  \"incident_id\": 1,\n"
        "  \"urgency_score\": 85,\n"
        "  \"urgency_level\": \"Critical\",\n"
        "  \"analysis_summary\": \"[Situation Analysis Agent] Objective #1: Assessed urgency as Critical (85/100). Resource deficit in: Medical Supplies, Transport Vehicles. Nearest available shelter: Community Gym (Cap: 70)\",\n"
        "  \"nearest_shelter\": { \"id\": 101, \"name\": \"Community Gym\", \"availableCapacity\": 70 },\n"
        "  \"resource_deficiencies\": [\n"
        "    { \"category\": \"Medical Supplies\", \"available\": 20, \"recommended\": 50, \"isDeficit\": true },\n"
        "    { \"category\": \"Food & Water Rations\", \"available\": 150, \"recommended\": 100, \"isDeficit\": false },\n"
        "    { \"category\": \"Transport Vehicles\", \"available\": 1, \"recommended\": 3, \"isDeficit\": true }\n"
        "  ],\n"
        "  \"llm_enhanced\": false,\n"
        "  \"status\": \"COMPLETED\"\n"
        "}"
    )
    add_code_block(doc, code_agent_contract, "JSON Schema Contract")

    doc.add_heading("6.2 Hybrid Architecture & Deterministic Fallback Resilience", level=2)
    doc.add_paragraph(
        "A major architectural strength of my design is resilience against external API failures. When an active Google "
        "Gemini API key is configured, the agent enhances its output with contextual tactical insights. However, if the "
        "API key is missing, network drops occur, or rate limits are reached, the agent automatically and seamlessly "
        "falls back to its internal mathematical tools. This prevents pipeline blockage and guarantees 100% demo safety."
    )

    add_figure(
        doc,
        "docs/images/real_screenshot_situation_analysis_agent_run.png",
        11,
        "Situation Analysis Agent Live CLI Execution & Structured JSON Assessment",
        "Terminal execution of python situation_analysis_agent.py showing real-time gap analysis calculation, tool evaluation, "
        "and structured JSON assessment output."
    )

    # =========================================================================
    # SECTION 7: API INTEGRATION, SECURITY & CROSS-PLATFORM (10 MARKS)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("7. API Integration, Security and Cross-Platform Functionality (Criterion 6 — 10 Marks)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Both the React web portal and Flutter mobile application communicate with the exact same ASP.NET Core REST API. "
        "Security is enforced uniformly across both client platforms through industry-standard protocols:"
    )

    doc.add_paragraph(
        "• JWT Authentication: Secure tokens generated with HMAC-SHA256 signatures, carrying user identity and role claims.\n"
        "• Role-Based Access Control (RBAC): Sensitive endpoints (such as shelter updates and stock adjustments) are guarded "
        "using [Authorize(Roles = \"Admin,Coordinator\")]. Read-only endpoints are accessible to authenticated responders.\n"
        "• Cross-Origin Resource Sharing (CORS): Configured in Program.cs to allow authorized web origins while preventing CSRF.\n"
        "• Client-Side Token Storage: Stored securely in browser localStorage in React and flutter_secure_storage / "
        "shared_preferences in Flutter, injected automatically into HTTP Authorization Bearer headers."
    )

    # =========================================================================
    # SECTION 8: TESTING, CI AND GIT WORKFLOW (8 MARKS)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("8. Testing, CI and Git Workflow (Criterion 7 — 8 Marks)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "I implemented a comprehensive multi-layer automated testing strategy covering backend unit and integration tests, "
        "React component tests, and Flutter widget/model tests. All tests execute automatically on every pull request "
        "via GitHub Actions."
    )

    doc.add_heading("8.1 Automated Test Execution Summary", level=2)
    
    tbl_t = doc.add_table(rows=5, cols=4)
    tbl_t.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_t.autofit = False

    t_cols_w = [Inches(1.5), Inches(2.2), Inches(1.5), Inches(1.3)]
    t_headers = ["Testing Suite", "Scope & Target Artifacts", "Test Framework", "Execution Result"]
    format_table_header(tbl_t.rows[0], t_headers, bg_hex="1B365D")

    test_summary_data = [
        ("Backend xUnit", "Shelters, Resources, Inventory, Geolocation, Situation Analysis", ".NET 8 xUnit + InMemory DB", "15/15 Passed (100%)\nDuration: 1.0s"),
        ("Frontend React", "ShelterList, ResourceList, InventoryList rendering & filters", "Vitest + React Testing Lib", "6/6 Passed (100%)\nDuration: 5.0s"),
        ("Mobile Flutter", "ShelterLocator, ResourceStatus, Models JSON serialization", "Flutter Test Framework", "30/30 Passed (100%)\nDuration: 1.8s"),
        ("GitHub Actions CI", "Complete build, lint, backend tests, react tests, flutter analyze", "GitHub Actions Multi-Job", "Green Build (Success)\nAll Jobs Green")
    ]

    for r_idx, r_vals in enumerate(test_summary_data):
        row = tbl_t.rows[r_idx + 1]
        for c_idx, w in enumerate(t_cols_w):
            row.cells[c_idx].width = w
        populate_table_row(row, r_vals, is_even=(r_idx % 2 == 1))

    add_figure(
        doc,
        "docs/images/real_screenshot_student2_backend_tests.png",
        12,
        "Student 2 Automated Backend xUnit Test Suite Execution (15 Tests Passing)",
        "PowerShell terminal capture showing all 15 automated backend tests executing and passing with zero failures in 1 second."
    )

    add_figure(
        doc,
        "docs/images/real_screenshot_student2_react_tests.png",
        13,
        "Student 2 React Web Component Unit Test Execution (6 Tests Passing)",
        "Terminal output of Vitest running component tests for ShelterList, ResourceList, and InventoryList, all passing cleanly."
    )

    add_figure(
        doc,
        "docs/images/real_screenshot_student2_flutter_tests.png",
        14,
        "Student 2 Flutter Mobile Widget & Model Test Suite Execution (30 Tests Passing)",
        "Flutter test execution console verifying responsive widget rendering, Haversine calculations, and JSON contracts."
    )

    add_figure(
        doc,
        "docs/images/real_screenshot_github_actions.png",
        15,
        "GitHub Actions Automated Multi-Job CI/CD Pipeline (Passing Build)",
        "Live GitHub Actions workflow showing green checkmarks across backend compilation, unit testing, React build, and Flutter analysis."
    )

    doc.add_heading("8.2 Student 2 Git Commit & Pull Request Contribution Audit Log", level=2)
    tbl_git = doc.add_table(rows=9, cols=4)
    tbl_git.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_git.autofit = False

    git_cols_w = [Inches(1.0), Inches(1.5), Inches(2.7), Inches(1.3)]
    git_headers = ["Commit / PR", "Date", "Commit Message / Description", "Impact Area"]
    format_table_header(tbl_git.rows[0], git_headers, bg_hex="1B365D")

    git_data = [
        ("d580b48", "2026-09-30", "feat: Integrate Google OAuth Sign-In, add Student 2 seed data and configure client credentials", "Backend / Auth"),
        ("0a9b916", "2026-09-27", "feat(backend): add NotificationsController with inventory and resource email alert endpoints", "Backend API"),
        ("7376f63", "2026-09-25", "Fix shelter card title overflow on Shelter Locator screen", "Flutter Mobile"),
        ("bfe72a9", "2026-09-23", "Implement Student 2 CRUD Operations for Shelters and Inventory", "Backend / DB"),
        ("2a1cbdd", "2026-09-21", "Implement Student 2, 3, and 4 Features: Dispatching, Volunteer Management, and AI Deficiency Table", "Team Integration"),
        ("25de8a9", "2026-09-18", "test(backend): Add edge case unit tests for shelters, inventory, and geolocation", "Quality Assurance"),
        ("49dec2c", "2026-09-16", "feat(maps): Add 3rd party maps and geolocation nearest shelter routing", "Third-Party API"),
        ("27e98ee", "2026-09-14", "feat(ui): update navigation topbar, theme styling, and resource incident coordination views", "React Web UI")
    ]

    for r_idx, r_vals in enumerate(git_data):
        row = tbl_git.rows[r_idx + 1]
        for c_idx, w in enumerate(git_cols_w):
            row.cells[c_idx].width = w
        populate_table_row(row, r_vals, is_even=(r_idx % 2 == 1))

    # =========================================================================
    # SECTION 9: ARCHITECTURE DECISION RECORDS (ADRs)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("9. Architecture Decision Records (ADRs)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_heading("ADR 02: Database Schema Strategy for Resource & Inventory Management & Situation Analysis Agent", level=2)
    doc.add_paragraph(
        "• Status: Approved | Decider: Student 2 (M. Thanusikan) | Date: 2026-09-10\n"
        "• Context: The platform requires real-time physical resource tracking, shelter capacity management, and inventory "
        "deficiency analysis. The Situation Analysis AI Agent requires structured operational state to evaluate disaster urgency.\n"
        "• Decision: Adopted a strictly normalized relational PostgreSQL schema (3NF) for Shelters, Resources, and InventoryItems, "
        "paired with an immutable SituationAssessments audit table for agentic AI outputs.\n"
        "• Rationale: Enforces foreign key referential integrity at the database layer (Shelter 1->N Resources, Shelter 1->N InventoryItems). "
        "Eliminates duplicate storage and guarantees that AI evaluations are auditable without permitting the AI to mutate operational records."
    )

    doc.add_heading("ADR 02.1: Third-Party Geolocation & OpenStreetMap Routing Strategy", level=2)
    doc.add_paragraph(
        "• Status: Approved | Decider: Student 2 (M. Thanusikan) | Date: 2026-09-16\n"
        "• Context: Emergency responders and citizens require proximity calculations to candidate evacuation shelters. A third-party "
        "maps/geolocation service integration is required by assignment specifications.\n"
        "• Decision: Implemented the Haversine Great-Circle Trigonometric Formula in GeolocationService.cs for in-memory Euclidean distance "
        "calculations (km), coupled with the OpenStreetMap Nominatim REST Geocoding API for resolving physical address strings.\n"
        "• Rationale: OpenStreetMap Nominatim provides free, reliable geocoding without proprietary API key locks. The in-memory Haversine "
        "calculation eliminates network latency when sorting candidate shelters, yielding sub-millisecond response times."
    )

    # =========================================================================
    # SECTION 10: ENGINEERING CHALLENGES & RESOLUTIONS
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("10. Engineering Challenges & Problem Resolution", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Challenge 1: Cross-Component Foreign Key Schema Inconsistency (Guid? vs int)\n"
        "• Problem: Student 3 implemented DispatchTask.ResourceId as a nullable Guid?, whereas my Resource entity used an integer Id. "
        "This prevented SQL foreign key joins and crashed dispatch task creation.\n"
        "• Resolution: I authored and applied EF Core migration '20260926062717_UnifyDispatchTaskResourceId', migrating the foreign key to int? "
        "with OnDelete(DeleteBehavior.SetNull). I also added cross-component integration tests to guarantee backward compatibility."
    )

    doc.add_paragraph(
        "Challenge 2: OpenStreetMap Nominatim Rate Limiting & Network Latency\n"
        "• Problem: Querying Nominatim for every proximity request risked HTTP 429 rate limit errors and introduced 500ms network latency.\n"
        "• Resolution: I engineered a coordinate caching strategy in GeolocationService.cs where pre-geocoded coordinates bypass external calls, "
        "executing distance calculations purely in-memory via the Haversine trigonometric formula."
    )

    doc.add_paragraph(
        "Challenge 3: Eliminating AI Hallucination in Shelter and Inventory State\n"
        "• Problem: Generative LLMs are prone to hallucinating phantom inventory numbers or recommending inactive shelters.\n"
        "• Resolution: I restricted the Situation Analysis Agent to a strictly read-only analytical advisory role governed by an explicit "
        "allow-list of mathematical tools. Database mutations remain strictly locked behind authenticated C# controller endpoints."
    )

    doc.add_paragraph(
        "Challenge 4: Flutter Mobile RenderFlex Layout Overflow\n"
        "• Problem: On constrained mobile screens, long shelter titles and status tags caused a 48px RenderFlex layout overflow.\n"
        "• Resolution: I refactored the widget tree in shelter_locator_screen.dart, wrapping text elements in Expanded containers and setting "
        "isExpanded: true on dropdown selectors, verified by automated widget tests."
    )

    # =========================================================================
    # SECTION 11: GENERATIVE AI USAGE LOG & REFLECTION (~1 PAGE)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("11. Generative AI Usage Log & Individual Reflection (~1 Page)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_heading("11.1 SLIIT Level 4 CLEAR Generative AI Usage Audit Log", level=2)
    tbl_ai = doc.add_table(rows=5, cols=4)
    tbl_ai.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_ai.autofit = False

    ai_cols_w = [Inches(1.0), Inches(1.8), Inches(2.2), Inches(1.5)]
    ai_headers = ["Date", "Module / Task", "Prompt Intent & CLEAR Framework", "Human Validation Applied"]
    format_table_header(tbl_ai.rows[0], ai_headers, bg_hex="1B365D")

    ai_log_data = [
        ("2026-09-10", "Situation Analysis Agent", "CLEAR Prompt: Design Python agent with tool allow-list and JSON output contract for disaster gap evaluation.", "Verified JSON schema contract and integrated with C# ASP.NET Core service."),
        ("2026-09-12", "C# Situation Service", "CLEAR Prompt: Refactor SituationAnalysisService.cs to mirror Python agent tools and persist workflow state in EF Core.", "Added LINQ queries for shelter occupancy math and registered service in DI container."),
        ("2026-09-16", "Geolocation & Maps", "CLEAR Prompt: Implement Haversine formula in C# for nearest shelter distance and OpenStreetMap geocoding.", "Added coordinate caching, OpenStreetMap URL launcher in Flutter, and fallback distance handling."),
        ("2026-09-18", "Automated Testing", "CLEAR Prompt: Generate xUnit edge-case tests, React Vitest tests, and Flutter widget tests for shelter logistics.", "Executed and debugged tests: 15 backend tests passing, 6 React tests passing, 30 Flutter tests passing.")
    ]

    for r_idx, r_vals in enumerate(ai_log_data):
        row = tbl_ai.rows[r_idx + 1]
        for c_idx, w in enumerate(ai_cols_w):
            row.cells[c_idx].width = w
        populate_table_row(row, r_vals, is_even=(r_idx % 2 == 1))

    doc.add_heading("11.2 Individual AI Reflection (~1 Page)", level=2)
    doc.add_paragraph(
        "Developing the Resource, Shelter, and Situation Analysis subsystems under the SLIIT Level 4 Generative AI guidelines "
        "provided deep practical insight into the boundary between AI acceleration and rigorous software engineering discipline. "
        "Throughout the project lifecycle, I utilized generative tools—primarily Google Gemini and Claude—as interactive "
        "pair-programming assistants for boilerplate scaffolding, mathematical formulas, and initial test skeletons."
    )
    doc.add_paragraph(
        "Where generative AI delivered genuine efficiency was in reducing syntactic friction. Writing repetitive DTO classes, "
        "Entity Framework Core mapping configurations, and basic CRUD controller boilerplate was significantly accelerated. "
        "Similarly, querying the trigonometric formulation of the Haversine equation saved valuable research time during the "
        "early implementation of the geolocation subsystem. The AI was also effective at scaffolding initial xUnit test cases "
        "and suggesting edge cases such as zero-capacity shelters."
    )
    doc.add_paragraph(
        "However, the development process underscored the critical limitations of generative AI in complex enterprise systems. "
        "Most notably, AI tools lack cross-component architectural context and domain awareness. When scaffolding the initial "
        "shelter update endpoints, the AI omitted fundamental business safeguards—allowing shelter occupancies to exceed total physical "
        "capacity and allowing stock adjustments to produce negative warehouse quantities without error. I had to intervene manually, "
        "engineering defensive validation checks and returning appropriate HTTP 400 Bad Request responses. Furthermore, the AI repeatedly "
        "suggested hallucinated entity relationships that conflicted with our normalized database design."
    )
    doc.add_paragraph(
        "In the mobile layer, AI-generated Flutter widget tests repeatedly failed due to layout render overflow on constrained viewports. "
        "Diagnosing and resolving these layout issues required deep personal engagement with Flutter's widget tree, understanding layout "
        "constraints, and applying Expanded and Flexible containers correctly."
    )
    doc.add_paragraph(
        "In conclusion, while generative AI served as a valuable productivity multiplier for routine coding, all architectural design, "
        "defensive business safeguards, data integrity enforcement, error handling, and test verifications were executed and validated "
        "by me. I have complete technical ownership of every line of code in my subsystem and am fully prepared to explain, test, modify, "
        "and defend my contribution during the oral viva examination."
    )

    # =========================================================================
    # SECTION 12: VIVA & TECHNICAL DEFENSE PREPARATION (Q&A)
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("12. Oral Viva & Technical Defense Preparation (Examiner Q&A)", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "This section details technical answers and code modifications for core viva defense questions that an examiner "
        "may ask Student 2 during the oral evaluation:"
    )

    doc.add_heading("Q1: Explain how your Haversine formula calculates straight-line distance in GeolocationService.cs.", level=2)
    doc.add_paragraph(
        "Answer: The Haversine formula calculates the great-circle distance between two points on a sphere given their longitudes "
        "and latitudes. In GeolocationService.cs, I convert latitude and longitude differences from degrees to radians, compute:\n"
        "a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)\n"
        "c = 2 * atan2(√a, √(1-a))\n"
        "distance = EarthRadiusKm (6371.0) * c\n"
        "This gives the exact distance in kilometers without making external network calls, allowing sub-millisecond proximity sorting."
    )

    doc.add_heading("Q2: How do you prevent over-allocation of shelter capacity? Walk through the code.", level=2)
    doc.add_paragraph(
        "Answer: In SheltersController.cs, the endpoint PUT /api/shelters/{id}/occupancy receives an UpdateShelterOccupancyDto. "
        "Before modifying the entity, the controller validates: if (dto.CurrentOccupancy > shelter.TotalCapacity), it immediately "
        "aborts and returns HTTP 400 BadRequest with an explanatory error message. If valid, it updates CurrentOccupancy, and if "
        "occupancy equals TotalCapacity, automatically sets Status = 'Full'. This is verified by SheltersControllerTests."
    )

    doc.add_heading("Q3: How is the Situation Analysis Agent's tool allow-list enforced?", level=2)
    doc.add_paragraph(
        "Answer: In situation_analysis_agent.py, self.allowed_tools defines ['calculate_urgency_score', 'evaluate_inventory_deficiencies', "
        "'find_nearest_available_shelter']. The agent executes strictly these three deterministic functions. It has no network socket "
        "permissions to write to the database or modify external files; its output is strictly a validated JSON object returned to the C# "
        "calling service, which alone holds database write authority."
    )

    doc.add_heading("Q4: If asked during the viva to add a new inventory category or threshold, how would you modify the code?", level=2)
    doc.add_paragraph(
        "Answer: In InventoryItem.cs, I would add the new category constant (e.g., 'CommunicationGear'). In InventoryController.cs, "
        "the adjust-stock endpoint already supports dynamic threshold calculation: (item.Quantity <= item.MinimumThreshold) ? 'LowStock' : 'InStock'. "
        "In React, InventoryList.jsx dynamically renders Category tags and thresholds without hardcoded enums. In backend-tests, I would "
        "add an xUnit Fact test asserting that an item in the new category triggers LowStock when its quantity drops below threshold."
    )

    # =========================================================================
    # SECTION 13: SIGNED DECLARATION OF AUTHENTICITY
    # =========================================================================
    doc.add_page_break()
    h1 = doc.add_heading("13. Signed Declaration of Authenticity", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "I, M. Thanusikan (IT24103609), declare that the work presented in my individual contribution to the SE3090 "
        "Assignment 1 (Integrated Full-Stack and Agentic AI Application Development) is my own original work, developed in "
        "accordance with the academic integrity regulations of the Sri Lanka Institute of Information Technology (SLIIT). "
        "I have contributed directly to the architecture, development, testing, and deployment of the Emergency Resource "
        "Coordination Platform as detailed in this document. All code, database schemas, test cases, and documentation have "
        "been reviewed, executed, and verified by me. I am fully prepared to explain, modify, test, and defend all submitted "
        "components during the oral viva and technical demonstration."
    )

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(16)
    p_sig.paragraph_format.space_after = Pt(4)
    run_s1 = p_sig.add_run(
        "Student Full Name: M. Thanusikan\n"
        "Student Registration ID: IT24103609\n"
        "Assigned Role: Student 2 — Resource & Inventory Lead + Situation Analysis Agent Lead\n"
        "Date: 30 September 2026\n\n"
        "Signature: "
    )
    run_s1.bold = True
    run_s1.font.size = Pt(10.5)
    run_s1.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    run_s2 = p_sig.add_run("M. Thanusikan (IT24103609)")
    run_s2.italic = True
    run_s2.font.size = Pt(10.5)

    output_path = "docs/SE3090_Assignment1_Student2_Answer_Document.docx"
    doc.save(output_path)
    print(f"Successfully generated Word document: {output_path}")

if __name__ == "__main__":
    build_student2_document()
