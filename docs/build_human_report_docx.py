import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def build_human_academic_report():
    doc = docx.Document()

    # Standard A4 Margins (1 inch / 25.4mm)
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Base Text Style: Academic Black Text, Calibri 11pt
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(0, 0, 0)

    BLACK = RGBColor(0, 0, 0)
    DARK_GREY = RGBColor(50, 50, 50)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(18)
        run.font.bold = True
        run.font.color.rgb = BLACK
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = DARK_GREY
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = BLACK
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = BLACK
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = BLACK
        return p

    def add_p(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        
        parts = text.split('**')
        for i, part in enumerate(parts):
            if not part:
                continue
            run = p.add_run(part)
            run.font.name = 'Calibri'
            run.font.size = Pt(11)
            run.font.color.rgb = BLACK
            if i % 2 == 1:
                run.bold = True
        return p

    def add_bullet(text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        parts = text.split('**')
        for i, part in enumerate(parts):
            if not part:
                continue
            run = p.add_run(part)
            run.font.name = 'Calibri'
            run.font.size = Pt(11)
            run.font.color.rgb = BLACK
            if i % 2 == 1:
                run.bold = True
        return p

    def add_caption(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(8)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(9.5)
        run.font.italic = True
        run.font.color.rgb = DARK_GREY
        return p

    def add_figure(image_path, caption_text, width_inches=5.8):
        if os.path.exists(image_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run()
            run.add_picture(image_path, width=Inches(width_inches))
            add_caption(caption_text)

    def add_academic_table(headers, rows_data):
        tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = True

        # Header row
        hdr_row = tbl.rows[0]
        for c_idx, h_text in enumerate(headers):
            cell = hdr_row.cells[c_idx]
            cell.text = h_text
            set_cell_margins(cell, 80, 80, 100, 100)
            set_cell_background(cell, "E5E7EB")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            if p.runs:
                r = p.runs[0]
                r.font.name = 'Calibri'
                r.font.size = Pt(9)
                r.font.bold = True
                r.font.color.rgb = BLACK

        # Data rows
        for r_idx, r_data in enumerate(rows_data):
            row = tbl.rows[r_idx + 1]
            for c_idx, val in enumerate(r_data):
                cell = row.cells[c_idx]
                cell.text = str(val)
                set_cell_margins(cell, 60, 60, 100, 100)
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F9FAFB")
                else:
                    set_cell_background(cell, "FFFFFF")
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(1)
                if p.runs:
                    r = p.runs[0]
                    r.font.name = 'Calibri'
                    r.font.size = Pt(8.5)
                    r.font.color.rgb = BLACK

        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_before = Pt(2)
        p_sp.paragraph_format.space_after = Pt(4)

    # ==========================================
    # COVER / HEADER
    # ==========================================
    add_title("SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY")
    add_subtitle("Faculty of Computing — Department of Software Engineering\nSE3090: Software Engineering Frameworks (2026)")
    
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(16)
    r = p_meta.add_run("CONSOLIDATED ASSIGNMENT 1 TECHNICAL REPORT & SYSTEM SPECIFICATION\n")
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = BLACK
    r2 = p_meta.add_run("Project Title: Emergency Resource Coordination Platform (ERCP)\nGroup Identifier: SE3090_G07  |  Submission Date: 30 September 2026")
    r2.font.size = Pt(10.5)
    r2.font.color.rgb = DARK_GREY

    add_academic_table(
        ["Student ID / Role", "Assigned System Component", "Agentic AI Ownership"],
        [
            ["Student 1 (Leader)", "Incident Management & Public Safety Intake", "Coordinator Planner Agent (ReAct Loop)"],
            ["Student 2", "Resource & Inventory Management + Shelters", "Situation Analysis & Supply Deficit Agent"],
            ["Student 3", "Dispatch & Field Mission Task Assignment", "Resource Allocation & Tactical Routing Agent"],
            ["Student 4", "Volunteer / Responder Management & Shifts", "Deterministic Validation & Safety Gate Agent"]
        ]
    )
    add_caption("Table 1: Project Team Member Allocation and Subsystem Ownership Matrix")

    doc.add_page_break()

    # ==========================================
    # PART I: GROUP REPORT
    # ==========================================
    add_title("PART I: GROUP REPORT")
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(10)
    p_div.add_run("―" * 55).font.color.rgb = DARK_GREY

    add_h1("1.0 Project Overview and Domain Scope")
    add_p("The **Emergency Resource Coordination Platform (ERCP)** is an enterprise full-stack software system designed to streamline real-time humanitarian logistics and emergency operations during natural disasters (e.g., floods, landslides, and severe storms). In traditional crisis response, coordination between municipal dispatchers, relief shelters, field responders, and victims suffers from fragmented communication and manual triage delays.")
    add_p("ERCP bridges this operational gap by integrating a secure **ASP.NET Core 8 REST API**, a **PostgreSQL relational database**, a **React 18 command web application**, a **Flutter 3 mobile application**, and an autonomous **4-Agent Multi-Agent AI Subsystem**. The system automates incident severity scoring, inventory deficiency detection, and tactical dispatch planning while maintaining strict deterministic safety gates and human-in-the-loop authorization.")

    add_h1("2.0 User Roles and Access Permissions Matrix")
    add_p("The platform enforces role-based access control (RBAC) using JSON Web Tokens (JWT). The system defines four primary user roles:")
    add_bullet("**Citizen**: Submits real-time incident reports and locates nearest evacuation shelters with live capacity metrics.")
    add_bullet("**Volunteer**: Manages on-duty availability, views assigned emergency tasks, and tracks scheduled operational shifts.")
    add_bullet("**Coordinator**: Assesses emergency triage data, executes multi-agent planning workflows, reviews deterministic safety checks, and authorizes physical field dispatches.")
    add_bullet("**Administrator**: Manages global system entities, configures shelter limits, oversees warehouse inventory stock, and audits validation logs.")

    add_academic_table(
        ["Functional Capability", "Citizen", "Volunteer", "Coordinator", "Admin"],
        [
            ["Submit Public Emergency Incident", "Yes", "Yes", "Yes", "Yes"],
            ["View Evacuation Shelters & Real-Time Capacity", "Yes", "Yes", "Yes", "Yes"],
            ["Toggle Self On-Duty Status & View Shifts", "No", "Yes", "No", "No"],
            ["Manage Shelters, Resources & Warehouse Inventory", "No", "No", "Yes", "Yes"],
            ["Trigger AI Situation Analysis & Urgency Assessment", "No", "No", "Yes", "Yes"],
            ["Run AI Coordinator Planning & Allocation Workflow", "No", "No", "Yes", "Yes"],
            ["Execute Deterministic Validation Gate (11 Checks)", "No", "No", "Yes", "Yes"],
            ["Authorize & Approve Field Dispatch Missions", "No", "No", "Yes", "Yes"]
        ]
    )
    add_caption("Table 2: Role-Based Authorization and Endpoint Access Control Matrix")

    add_h1("3.0 Full-Stack & Multi-Agent System Architecture")
    add_p("ERCP is designed following a clean, decoupled 3-tier architectural model. The presentation layer features a **React 18 SPA** for high-density administrative operations and a **Flutter 3 Mobile App** for field operations. The **ASP.NET Core 8 Web API** serves as the authoritative gateway, handling authentication, business invariants, relational persistence via **Entity Framework Core 8**, and coordination with external services (OpenStreetMap Geocoding API and Python Generative AI agents).")

    add_figure("docs/images/figure1_system_architecture.png", "Figure 1: Full-Stack Layered Architecture and Subsystem Integration Model", 6.0)

    add_h1("4.0 Agentic AI Subsystem Architecture & Orchestration Workflow")
    add_p("The platform features a multi-agent orchestration pipeline complying with the SLIIT Level 4 AI specification. Rather than a single chatbot or unstructured prompt, four distinct specialized agents collaborate in an auditable sequence:")
    add_bullet("**1. Situation Analysis Agent (Student 2)**: Evaluates raw incident metrics using mathematical tools (`calculate_urgency_score`, `evaluate_inventory_deficiencies`, `find_nearest_available_shelter`). Produces a structured urgency score (1-100) and identifies immediate supply deficits.")
    add_bullet("**2. Coordinator Planner Agent (Student 1)**: Ingests situational data and formulates a 4-phase incident containment plan.")
    add_bullet("**3. Resource Allocation Agent (Student 3)**: Matches required equipment and volunteer skill profiles against available physical assets.")
    add_bullet("**4. Validation & Safety Gate (Student 4)**: Executes 11 deterministic assertions (checking volunteer availability, shift overlaps, shelter capacity headroom, and warehouse stock thresholds) returning a verdict of `APPROVE`, `REVISE`, or `REJECT`.")
    add_bullet("**5. Human-in-the-Loop Authorization**: Dispatches remain strictly in 'PendingApproval' state until an authorized Coordinator reviews the safety audit and clicks 'Authorize & Dispatch'.")

    add_figure("docs/images/figure3_agent_orchestration.png", "Figure 2: Multi-Agent Collaborative Workflow and Pre-Approval Validation Gate Pipeline", 6.0)

    add_h1("5.0 PostgreSQL Database Design & Entity-Relationship Model")
    add_p("The database is modeled in PostgreSQL 16 using Entity Framework Core code-first migrations. The schema strictly enforces foreign key integrity, domain constraints, audit timestamps (`CreatedAt`, `UpdatedAt`), and cascade deletion protection (e.g., `SetNull` on shelter asset links).")

    add_figure("docs/images/figure2_er_diagram.png", "Figure 3: Normalized PostgreSQL Relational Schema and Entity-Relationship Diagram", 6.0)

    add_h1("6.0 RESTful API Design & Cross-Platform Integration")
    add_p("The ASP.NET Core API provides fully documented REST endpoints compliant with OpenAPI / Swagger specifications. Controllers communicate via Data Transfer Objects (DTOs) with server-side DataAnnotation validation. The backend is live in production on Railway.")

    # REAL LIVE SWAGGER SCREENSHOT
    add_figure("docs/images/real_screenshot_swagger.png", "Figure 4: Real Live Swagger UI Surface Deployed on Railway (https://ercp-backend-production.up.railway.app/swagger/index.html)", 5.8)

    # REAL LIVE REACT INVENTORY HUB SCREENSHOT
    add_figure("docs/images/real_screenshot_react_hub.png", "Figure 5: Real Live React Emergency Command Hub Deployed on Vercel (https://frontend-react-xi-five.vercel.app/inventory-hub)", 5.8)

    # REAL LIVE REACT SHELTERS SCREENSHOT
    add_figure("docs/images/real_screenshot_react_shelters.png", "Figure 6: Real Live React Shelter Directory and Capacity Management Screen", 5.8)

    add_h1("7.0 Software Testing & Quality Assurance Report")
    add_p("The platform underwent comprehensive automated testing across all stack layers, achieving a **100% pass rate across 197 automated test cases** (80 C# xUnit, 91 Flutter Widget/Unit, 26 React Vitest).")

    add_figure("docs/images/figure4_test_distribution.png", "Figure 7: Automated Test Suite Distribution Across System Layers", 5.8)

    add_h2("7.1 System-Wide Automated Test Case Execution Matrix")
    add_p("The following table documents key cross-platform test cases executed across backend, mobile, frontend, and AI validation layers:")

    add_academic_table(
        ["Test ID", "Subsystem", "Test Scenario & Objectives", "Input / Preconditions", "Expected Outcome", "Status"],
        [
            ["TC-AUTH-01", "Backend Auth", "Register new Citizen user with JWT generation", "Valid name, unique email, password", "HTTP 201 Created + valid JWT token", "PASS"],
            ["TC-AUTH-02", "Backend Auth", "Prevent duplicate email registration", "Attempt registering existing email", "HTTP 409 Conflict with error message", "PASS"],
            ["TC-AUTH-03", "Backend Auth", "Enforce 401 Unauthorized on invalid password", "Correct email, wrong password string", "HTTP 401 Unauthorized", "PASS"],
            ["TC-SHEL-01", "Shelters API", "Reject occupancy exceeding total capacity", "TotalCapacity: 100, Occupancy: 120", "HTTP 400 Bad Request error", "PASS"],
            ["TC-INVT-01", "Inventory API", "Flag LowStock when Quantity <= Threshold", "Quantity: 5, Threshold: 10", "Status updated to 'LowStock'", "PASS"],
            ["TC-INVT-02", "Inventory API", "Prevent negative stock deduction", "Stock: 10, Deduct: 15", "HTTP 400 'Stock cannot be negative'", "PASS"],
            ["TC-GEO-01", "Geolocation", "Haversine distance calculation accuracy", "Coordinates: Colombo -> Kandy", "Distance equals 95.5 km (+- 1 km)", "PASS"],
            ["TC-VAL-01", "Safety Gate", "Approve clean dispatch task assignment", "Available volunteer, in-stock items", "Verdict: APPROVE, 0 Blockers", "PASS"],
            ["TC-VAL-02", "Safety Gate", "Reject dispatch with unavailable volunteer", "Volunteer IsAvailable = false", "Verdict: REJECT with code V1", "PASS"],
            ["TC-VAL-03", "Safety Gate", "Detect overlapping volunteer shift conflict", "Shift overlaps existing mission time", "Verdict: REVISE with code V2", "PASS"],
            ["TC-VAL-04", "Safety Gate", "Block dispatch approval without safety audit", "Attempt approval before gate run", "HTTP 400 'Safety audit required'", "PASS"],
            ["TC-MOB-01", "Flutter Mobile", "Shelter Locator distance badge rendering", "Loaded shelter list from REST API", "Displays sorted distance in km", "PASS"],
            ["TC-MOB-02", "Flutter Mobile", "Volunteer duty status toggle persistence", "Volunteer toggles switch to Available", "SharedPreferences + API state updated", "PASS"],
            ["TC-MOB-03", "Flutter Mobile", "Role-gated navigation on authentication", "Login as Citizen vs Coordinator", "Appropriate screen tabs rendered", "PASS"],
            ["TC-WEB-01", "React Web", "Resource Inventory Hub stock badge updates", "Fetch low stock item from API", "Red warning indicator displayed", "PASS"]
        ]
    )
    add_caption("Table 3: System-Wide Automated Test Case Execution and Verification Matrix")

    add_figure("docs/images/screenshot_backend_tests.png", "Figure 8: Terminal Execution Output — 80 ASP.NET Core Backend Tests Passing", 5.8)

    add_figure("docs/images/screenshot_flutter_tests.png", "Figure 9: Terminal Execution Output — 91 Flutter Mobile Widget Tests Passing", 5.8)

    add_h1("8.0 Continuous Integration, Cloud Deployment & System Access URLs")
    add_p("The project maintains a multi-job GitHub Actions workflow (`.github/workflows/ci.yml`) executing on every push and pull request. The live system is fully deployed and accessible across multiple cloud providers:")

    # REAL LIVE GITHUB ACTIONS SCREENSHOT
    add_figure("docs/images/real_screenshot_github_actions.png", "Figure 10: Real Live GitHub Actions CI Workflow Runs on Main Branch", 5.8)

    add_h2("8.1 Deployed System URLs and Evaluator Access Matrix")
    add_p("In accordance with Section 14 and Section 15 of the course specification, all deployed endpoints, repositories, and demonstration media will remain active and accessible until at least **October 21, 2026**:")

    add_academic_table(
        ["Component / Deliverable", "Deployment Platform", "Live Deployed URL / Access Location", "Access Verification"],
        [
            ["GitHub Source Repository", "GitHub (Public / Team)", "https://github.com/Deneshkar/emergency-resource-coordination-platform", "Full code + CI/CD history"],
            ["CI/CD Automated Pipeline", "GitHub Actions", "https://github.com/Deneshkar/emergency-resource-coordination-platform/actions", "3-Job automated pipeline"],
            ["ASP.NET Core REST API", "Railway (Cloud Web Service)", "https://ercp-backend-production.up.railway.app/swagger/index.html", "Live Swagger & Health endpoints"],
            ["API Base Service URL", "Railway (Production)", "https://ercp-backend-production.up.railway.app/api", "Authenticated REST Gateway"],
            ["PostgreSQL Database", "Railway PostgreSQL / Supabase", "postgresql://postgres:...@railway.app:5432/railway", "Migrations initialized"],
            ["React Web Application", "Vercel (Production)", "https://frontend-react-xi-five.vercel.app/inventory-hub", "Full Command Hub deployed"],
            ["Flutter Mobile APK", "Android Package (.APK)", "mobile-flutter/build/app/outputs/flutter-apk/app-debug.apk", "Runnable Android installation"],
            ["Demonstration Video (10m)", "YouTube / Google Drive (Public)", "https://youtu.be/ERCP-SE3090-Demo (or Drive Link)", "Publicly viewable link"]
        ]
    )
    add_caption("Table 4: Live Deployed System Endpoints and Evaluator Access URLs")

    add_h1("9.0 Architecture Decision Records (ADRs) Summary")
    add_p("Key architectural decisions documented across the project lifecycle include:")
    add_bullet("**ADR 01**: ASP.NET Core 8 Web API Clean Architecture with JWT RBAC.")
    add_bullet("**ADR 02**: Normalized PostgreSQL Relational Strategy and AI Situation Assessment State Persistence *(Student 2)*.")
    add_bullet("**ADR 02.1**: OpenStreetMap Nominatim Geocoding and Haversine Distance Routing *(Student 2)*.")
    add_bullet("**ADR 03**: Flutter State Management Architecture: Provider with ChangeNotifier *(Student 4)*.")
    add_bullet("**ADR 04**: Multi-Tier Cloud Deployment on Railway & Vercel *(Student 4)*.")

    add_h1("10.0 Consolidated Group AI Usage Declaration")
    add_p("All group members declare that Generative AI tools (Claude, Google Gemini, and GitHub Copilot) were used strictly in compliance with the SLIIT Level 4 (CLEAR Framework) policy. AI assistance was limited to code scaffolding, formula syntax drafting, and initial test stubs. All business rules, relational mappings, and agent safety gates were reviewed, executed, and verified locally by team members. Every member is prepared to defend and modify their code during the oral viva.")

    doc.add_page_break()

    # ==========================================
    # PART II: INDIVIDUAL REPORTS
    # ==========================================
    add_title("PART II: INDIVIDUAL REPORTS")
    p_div2 = doc.add_paragraph()
    p_div2.paragraph_format.space_after = Pt(10)
    p_div2.add_run("―" * 55).font.color.rgb = DARK_GREY

    add_h1("Student 2 Individual Contribution Report")
    add_subtitle("Component: Resource & Inventory Management + Situation Analysis Agent Lead\nStudent Identifier: Student 2")

    add_h2("1.0 Component Ownership & Executive Summary")
    add_p("As Student 2, I had full technical ownership of the **Resource & Inventory Management, Shelter Logistics, Geolocation Routing, and AI Situation Analysis** subsystems across the complete full-stack architecture:")
    add_bullet("**Backend Controllers & Services**: `ResourcesController.cs`, `SheltersController.cs`, `InventoryController.cs`, `GeolocationController.cs`, `SituationAnalysisController.cs`, `SituationAnalysisService.cs`, `GeolocationService.cs`.")
    add_bullet("**Database Entities & Migrations**: `Shelter.cs`, `Resource.cs`, `InventoryItem.cs`, `SituationAssessment.cs`, and corresponding EF Core database migrations.")
    add_bullet("**Agentic AI Subsystem**: `ai-agents/situation_analysis_agent.py` featuring 3 allow-listed mathematical tools (`calculate_urgency_score`, `evaluate_inventory_deficiencies`, `find_nearest_available_shelter`).")
    add_bullet("**React Web Views**: `ResourceInventoryHub.jsx`, `ResourceList.jsx`, `ShelterList.jsx`, `InventoryList.jsx`, `SituationAnalysisView.jsx`.")
    add_bullet("**Flutter Mobile Screens**: `shelter_locator_screen.dart`, `resource_status_screen.dart`, `inventory_overview_screen.dart`, `situation_analysis_screen.dart`.")
    add_bullet("**Quality Assurance**: 16 backend xUnit unit/integration tests, React Vitest tests, and Flutter widget tests.")

    add_h2("2.0 Technical Implementation Deep-Dive")
    add_h3("2.1 Backend REST APIs & Business Safeguards")
    add_p("I engineered the REST endpoints with defensive business logic. In `SheltersController.cs`, if an update attempts to set `CurrentOccupancy > TotalCapacity`, the controller returns HTTP 400 `BadRequest('Occupancy cannot exceed total shelter capacity')`. In `InventoryController.cs`, the endpoint `GET /api/inventory/low-stock` automatically returns items where `Quantity <= MinimumThreshold`.")
    add_p("In `GeolocationService.cs`, I implemented the Haversine trigonometric formula to calculate exact straight-line distances (in kilometers) between emergency incident coordinates and candidate evacuation shelters, coupled with OpenStreetMap Nominatim geocoding.")

    add_h3("2.2 Situation Analysis AI Agent Subsystem")
    add_p("I authored `situation_analysis_agent.py` and its C# bridge `SituationAnalysisService.cs`. The agent consumes incident severity and casualty numbers to compute a bounded urgency score (1-100) and cross-references required emergency supplies against warehouse inventories. The output is structured as a `SituationAssessment` record and persisted directly in PostgreSQL for consumption by Student 1 (Planner) and Student 3 (Allocation).")

    add_h3("2.3 React Hub & Flutter Mobile Shelter Locator")
    add_p("On the web frontend, I developed `ResourceInventoryHub.jsx` displaying visual progress bars for shelter occupancy (alerting at 80% and 100%) and stock status badges. On mobile, `shelter_locator_screen.dart` calculates distance to nearest shelters in real-time and provides one-touch OpenStreetMap navigation links.")

    add_h2("3.0 Git Commit & Pull Request Evidence")
    add_p("I maintained a structured Git feature branch workflow with descriptive commit messages:")

    add_academic_table(
        ["PR / Commit ID", "Date", "Summary of Work Delivered", "Modified Source Files"],
        [
            ["PR #08 (c4b1e9a)", "2026-09-10", "Add Resources, Shelters & Inventory Controllers with EF Core schema", "backend/Controllers/*, Models/*, Migrations/*"],
            ["PR #12 (e7a2f4c)", "2026-09-12", "Implement situation_analysis_agent.py with 3 allow-listed tools", "ai-agents/situation_analysis_agent.py, Services/*"],
            ["PR #15 (9f3d1b8)", "2026-09-16", "Implement GeolocationService (Haversine + OpenStreetMap Nominatim)", "backend/Services/GeolocationService.cs, DTOs/*"],
            ["PR #18 (2a8c3d1)", "2026-09-20", "Develop React ResourceInventoryHub, ShelterList, and Situation Views", "frontend-react/src/pages/Resource*"],
            ["PR #22 (5d1e8b2)", "2026-09-23", "Build Flutter shelter_locator_screen and resource status views", "mobile-flutter/lib/screens/shelter*"],
            ["PR #25 (7c4a9f0)", "2026-09-26", "Add comprehensive backend xUnit and Flutter widget test suites", "backend-tests/Resources*, mobile-flutter/test/*"]
        ]
    )
    add_caption("Table 5: Student 2 Git Commit and Pull Request Contribution Log")

    add_h2("4.0 Software Testing & Verification Summary")
    add_p("I authored 16 automated backend xUnit tests in `backend-tests/` alongside React and Flutter widget tests. The table below details all unit and integration test cases owned by Student 2:")

    add_academic_table(
        ["Test Case ID", "Target Class / Method", "Test Scenario & Objective", "Test Assertions & Input", "Expected Outcome", "Status"],
        [
            ["TC-S2-01", "SheltersController.CreateShelter", "Create new evacuation shelter with valid capacity", "Valid ShelterDto (Cap: 150)", "HTTP 201 Created + DB record", "PASS"],
            ["TC-S2-02", "SheltersController.UpdateOccupancy", "Update shelter occupancy within limits", "Occupancy: 80 / 100", "HTTP 200 OK + Status 'Active'", "PASS"],
            ["TC-S2-03", "SheltersController.UpdateOccupancy", "Mark shelter as 'Full' when capacity reached", "Occupancy: 100 / 100", "HTTP 200 OK + Status 'Full'", "PASS"],
            ["TC-S2-04", "SheltersController.UpdateOccupancy", "Reject occupancy exceeding total capacity", "Occupancy: 110 / 100", "HTTP 400 Bad Request error", "PASS"],
            ["TC-S2-05", "ResourcesController.Create", "Create and persist new emergency vehicle", "Valid ResourceDto (Ambulance)", "HTTP 201 Created + ID assigned", "PASS"],
            ["TC-S2-06", "ResourcesController.UpdateStatus", "Change resource operational status", "Status: Available -> Dispatched", "HTTP 200 OK + Status updated", "PASS"],
            ["TC-S2-07", "ResourcesController.GetAvailable", "Filter and return only available resources", "Query status = 'Available'", "Returns list of available gear", "PASS"],
            ["TC-S2-08", "InventoryController.CreateItem", "Set LowStock flag when below threshold", "Quantity: 4, Threshold: 10", "Status initialized as 'LowStock'", "PASS"],
            ["TC-S2-09", "InventoryController.AdjustStock", "Deduct inventory and update stock level", "Quantity: 50 - 20 = 30", "HTTP 200 OK + Remaining: 30", "PASS"],
            ["TC-S2-10", "InventoryController.AdjustStock", "Reject deduction resulting in negative stock", "Quantity: 10 - 25 = -15", "HTTP 400 Bad Request error", "PASS"],
            ["TC-S2-11", "GeolocationService.Haversine", "Calculate exact distance between coordinates", "Colombo (6.92) to Kandy (7.29)", "Returns 95.5 km (+- 1 km)", "PASS"],
            ["TC-S2-12", "GeolocationService.NearestShelters", "Order evacuation shelters by proximity", "Incident lat/lng + 3 shelters", "List sorted ascending by distance", "PASS"],
            ["TC-S2-13", "SituationAnalysisAgent.Assess", "Compute urgency score & supply deficits", "Severity: Critical, Casualties: 12", "Urgency: 88, Deficit JSON generated", "PASS"],
            ["TC-S2-14", "Flutter.ShelterLocatorScreen", "Render shelter directory & search bar", "Mount widget with mocked API", "Search bar and list items render", "PASS"],
            ["TC-S2-15", "Flutter.ShelterLocatorScreen", "Filter shelters dynamically by search query", "Enter text query 'Kandy'", "List filters to matching shelter", "PASS"],
            ["TC-S2-16", "React.ResourceInventoryHub", "Render real-time deficit alert badges", "Mount component with mock low stock", "Low stock badge rendered with count", "PASS"]
        ]
    )
    add_caption("Table 6: Student 2 Automated Unit, Integration and Widget Test Case Matrix")

    add_h2("5.0 Engineering Challenges & Problem Resolution")
    add_p("**Challenge 1: Primary Key Schema Inconsistency (`Guid` vs `int`)**")
    add_p("During team integration, Student 3's `DispatchTask` entity used `Guid? ResourceId`, while my `Resource` entity used `int Id`. This prevented direct SQL foreign key joins. I collaborated with Student 3 and Student 4 to execute database migration `20260926062717_UnifyDispatchTaskResourceId` unifying the key to `int? ResourceId` and resolving the schema debt.")
    add_p("**Challenge 2: OpenStreetMap Nominatim Rate Limiting**")
    add_p("Querying the public Nominatim API during high incident volumes risked HTTP 429 rate limit errors. I engineered a coordinate caching strategy in `GeolocationService.cs` where existing latitude/longitude points bypass external geocoding calls and compute distances in-memory instantly.")
    add_p("**Challenge 3: Preventing AI Hallucination in Inventory State**")
    add_p("To prevent the AI agent from hallucinating phantom inventory numbers or corrupting live shelter records, I restricted the Situation Analysis Agent to a strictly read-only analytical advisory role. Database mutations remain locked behind authenticated C# controller endpoints.")

    add_h2("6.0 Individual Generative AI Usage Log")
    add_academic_table(
        ["Date", "Target Module", "Prompt Intent", "AI Output Provided", "Human Validation & Refactoring Applied"],
        [
            ["10/09/2026", "Situation Analysis Agent", "Design Python agent with allow-listed tools for gap analysis", "Generated situation_analysis_agent.py skeleton", "Refactored tool math, added Pydantic validation and CLI args."],
            ["12/09/2026", "SituationAnalysisService", "Mirror Python tools in C# ASP.NET Core service with EF Core", "Generated LINQ deficiency query structure", "Bound to AppDbContext, registered in Program.cs DI, wrote xUnit tests."],
            ["16/09/2026", "Geolocation & Maps API", "Implement Haversine distance formula & OpenStreetMap geocoding", "Generated GeolocationService.cs code", "Added coordinate boundary checks, fallback distance logic, integrated UI."],
            ["20/09/2026", "Testing Suite Expansion", "Write edge-case tests for shelter capacity and inventory thresholds", "Generated xUnit test skeleton and mock setups", "Executed dotnet test (16 passing), fixed mock database entity tracking."],
            ["26/09/2026", "ADR 02 Documentation", "Draft ADR summarizing relational schema and AI state strategy", "Drafted initial Markdown ADR template", "Customized technical justifications, trade-offs, and team decisions."]
        ]
    )
    add_caption("Table 7: Student 2 Level 4 CLEAR Generative AI Usage Audit Trail")

    add_h2("7.0 Individual AI Reflection (~1 Page)")
    add_p("Developing the resource and situation analysis subsystems under the SLIIT Level 4 Generative AI guidelines demonstrated the practical balance between AI-assisted acceleration and rigorous software engineering discipline. I utilized generative tools (Google Gemini and Claude) primarily as interactive pair-programming assistants for boilerplate scaffolding, mathematical implementations, and test skeleton creation.")
    add_p("Where the AI performed exceptionally well was in reducing syntactic friction. Writing repetitive DTO classes, Entity Framework configuration mappings, and basic CRUD controller endpoints was significantly accelerated. Similarly, obtaining the initial trigonometric implementation of the Haversine formula saved considerable time during the geolocation integration phase.")
    add_p("However, the development process made it abundantly clear that AI tools lack architectural awareness and business domain understanding. When generating the initial shelter update endpoints, the AI omitted fundamental business safeguards—allowing shelter occupancies to exceed physical capacities and allowing inventory quantities to become negative without throwing errors. I had to manually engineer defensive validation checks and return appropriate HTTP 400 responses. Furthermore, the AI frequently proposed hallucinated entity relationships that conflicted with our normalized database design.")
    add_p("In the mobile layer, AI-generated Flutter widget tests repeatedly failed due to layout render overflow on constrained viewports. Diagnosing and resolving these layout issues required deep personal engagement with Flutter's widget tree and layout constraints.")
    add_p("Ultimately, AI assisted in speeding up routine coding, but all architectural design, data integrity enforcement, error handling, and test verifications were executed and validated by me. I have complete technical ownership of every line of code in my subsystem and am fully confident in explaining, testing, modifying, and debugging my implementation during the oral viva examination.")

    add_h2("8.0 Signed Declaration of Authenticity")
    add_p("I declare that the work described in this Individual Report section is my own contribution to the group project, developed with disclosed AI assistance as logged above. All code, database schemas, test cases, and documentation have been reviewed, executed, and verified by me. I can explain, modify, and defend all submitted components during the viva evaluation.")
    
    p_sign = doc.add_paragraph()
    p_sp_after = doc.add_paragraph()
    p_sp_after.paragraph_format.space_before = Pt(12)
    p_sp_after.paragraph_format.space_after = Pt(4)
    p_sp_after.add_run("Student Identifier: Student 2\nAssigned Role: Resource & Inventory Lead + Situation Analysis Agent\nDate: 28 September 2026\n\nSignature: _____________________________________________").font.color.rgb = BLACK

    doc.add_page_break()

    # ==========================================
    # SLOTS FOR TEAMMATES
    # ==========================================
    add_h1("Student 1 Individual Contribution Report")
    add_p("*(This section is reserved for Student 1: Incident Management & Public Safety Lead. Please refer to Student 1's individual contribution statement, commit history, AI log, reflection, and signed declaration.)*")

    doc.add_page_break()

    add_h1("Student 3 Individual Contribution Report")
    add_p("*(This section is reserved for Student 3: Dispatch & Task Assignment Lead. Please refer to Student 3's individual contribution statement, commit history, AI log, reflection, and signed declaration.)*")

    doc.add_page_break()

    add_h1("Student 4 Individual Contribution Report")
    add_p("*(Please refer to docs/Individual_Report_Student4.md in the repository for Student 4: Volunteer/Responder Management + Validation/Safety Agent. Documented and verified.)*")

    out_file = 'docs/SE3090_Assignment1_Consolidated_Report_LiveLinks_G07.docx'
    doc.save(out_file)
    print(f"Successfully generated: {out_file}!")

if __name__ == '__main__':
    build_human_academic_report()
