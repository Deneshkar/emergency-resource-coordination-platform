import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs('docs/images', exist_ok=True)

# Set global academic styles
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

def generate_system_architecture():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Background containers
    # 1. Client Layer
    ax.add_patch(patches.FancyBboxPatch((4, 72), 92, 24, boxstyle="round,pad=1", ec="#1e293b", fc="#f8fafc", lw=1.5))
    ax.text(6, 92, "1. Presentation Layer (Dual Cross-Platform Clients)", fontsize=11, fontweight='bold', color="#0f172a")
    
    # React App Box
    ax.add_patch(patches.FancyBboxPatch((8, 75), 40, 14, boxstyle="round,pad=0.5", ec="#2563eb", fc="#ffffff", lw=1.2))
    ax.text(28, 83.5, "React 18 SPA (Vite Web App)", fontsize=10, fontweight='bold', ha='center', color="#1e3a8a")
    ax.text(28, 78, "Command Hub • Incident Triage • Agent Monitoring", fontsize=8.5, ha='center', color="#475569")

    # Flutter App Box
    ax.add_patch(patches.FancyBboxPatch((52, 75), 40, 14, boxstyle="round,pad=0.5", ec="#0284c7", fc="#ffffff", lw=1.2))
    ax.text(72, 83.5, "Flutter 3 Mobile App (Dart / MVVM)", fontsize=10, fontweight='bold', ha='center', color="#0369a1")
    ax.text(72, 78, "Field Responders • Shelter GPS • Duty Status", fontsize=8.5, ha='center', color="#475569")

    # 2. Application Layer (ASP.NET Core)
    ax.add_patch(patches.FancyBboxPatch((4, 34), 92, 32, boxstyle="round,pad=1", ec="#1e293b", fc="#f1f5f9", lw=1.5))
    ax.text(6, 62, "2. Authoritative Application Layer: ASP.NET Core 8 Web API", fontsize=11, fontweight='bold', color="#0f172a")

    # Controllers Box
    ax.add_patch(patches.FancyBboxPatch((7, 37), 42, 21, boxstyle="round,pad=0.5", ec="#475569", fc="#ffffff", lw=1))
    ax.text(28, 54, "REST API Gateway & Controllers", fontsize=9.5, fontweight='bold', ha='center', color="#1e293b")
    ax.text(28, 48.5, "• ResourcesController (Student 2)\n• Shelters & Inventory Controllers\n• Volunteers, Dispatches, Incidents", fontsize=8, ha='center', color="#334155")
    ax.text(28, 40, "JWT Auth • DTO Validation • CORS Middleware", fontsize=7.5, fontstyle='italic', ha='center', color="#64748b")

    # Services Box
    ax.add_patch(patches.FancyBboxPatch((51, 37), 42, 21, boxstyle="round,pad=0.5", ec="#475569", fc="#ffffff", lw=1))
    ax.text(72, 54, "Domain Services & Agent Orchestration", fontsize=9.5, fontweight='bold', ha='center', color="#1e293b")
    ax.text(72, 48.5, "• SituationAnalysisService (Student 2)\n• DispatchValidationService (11 Rules)\n• GeolocationService (Haversine)", fontsize=8, ha='center', color="#334155")
    ax.text(72, 40, "IncidentPlannerService • SmtpEmailService", fontsize=7.5, fontstyle='italic', ha='center', color="#64748b")

    # 3. Persistence & AI Infrastructure
    ax.add_patch(patches.FancyBboxPatch((4, 4), 92, 24, boxstyle="round,pad=1", ec="#1e293b", fc="#f8fafc", lw=1.5))
    ax.text(6, 24, "3. Persistence, External APIs & Multi-Agent Infrastructure", fontsize=11, fontweight='bold', color="#0f172a")

    # PostgreSQL Box
    ax.add_patch(patches.FancyBboxPatch((7, 7), 26, 14, boxstyle="round,pad=0.5", ec="#0d9488", fc="#ffffff", lw=1.2))
    ax.text(20, 15.5, "PostgreSQL 16 DB", fontsize=9.5, fontweight='bold', ha='center', color="#0f766e")
    ax.text(20, 10.5, "EF Core 8 Migrations\nNormalized Schema", fontsize=8, ha='center', color="#475569")

    # Python Agents Box
    ax.add_patch(patches.FancyBboxPatch((37, 7), 26, 14, boxstyle="round,pad=0.5", ec="#7c3aed", fc="#ffffff", lw=1.2))
    ax.text(50, 15.5, "Python AI Subsystem", fontsize=9.5, fontweight='bold', ha='center', color="#6d28d9")
    ax.text(50, 10.5, "4 Specialized Agents\nGemini 2.5/3.0 CLI", fontsize=8, ha='center', color="#475569")

    # Third-Party Box
    ax.add_patch(patches.FancyBboxPatch((67, 7), 26, 14, boxstyle="round,pad=0.5", ec="#ea580c", fc="#ffffff", lw=1.2))
    ax.text(80, 15.5, "OpenStreetMap API", fontsize=9.5, fontweight='bold', ha='center', color="#c2410c")
    ax.text(80, 10.5, "Nominatim Geocoding\nTile Mapping Server", fontsize=8, ha='center', color="#475569")

    # Connecting Arrows
    ax.annotate('', xy=(28, 66), xytext=(28, 72), arrowprops=dict(arrowstyle='<->', lw=1.5, color='#334155'))
    ax.annotate('', xy=(72, 66), xytext=(72, 72), arrowprops=dict(arrowstyle='<->', lw=1.5, color='#334155'))
    ax.annotate('', xy=(20, 28), xytext=(28, 34), arrowprops=dict(arrowstyle='<->', lw=1.5, color='#334155'))
    ax.annotate('', xy=(50, 28), xytext=(50, 34), arrowprops=dict(arrowstyle='<->', lw=1.5, color='#334155'))
    ax.annotate('', xy=(80, 28), xytext=(72, 34), arrowprops=dict(arrowstyle='<->', lw=1.5, color='#334155'))

    plt.tight_layout()
    plt.savefig('docs/images/figure1_system_architecture.png', bbox_inches='tight')
    plt.close()
    print("Generated figure1_system_architecture.png")

def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 7), dpi=300)
    ax.set_xlim(0, 105)
    ax.set_ylim(0, 100)
    ax.axis('off')

    def draw_entity(x, y, w, h, title, fields, border_color="#334155", bg_color="#ffffff"):
        ax.add_patch(patches.Rectangle((x, y), w, h, ec=border_color, fc=bg_color, lw=1.2))
        ax.add_patch(patches.Rectangle((x, y + h - 4), w, 4, ec=border_color, fc="#f1f5f9", lw=1.2))
        ax.text(x + w/2, y + h - 2.8, title, fontsize=9, fontweight='bold', ha='center', va='center', color="#0f172a")
        field_str = "\n".join(fields)
        ax.text(x + 1.5, y + h - 6, field_str, fontsize=7.5, va='top', fontfamily='monospace', color="#1e293b")

    # Draw entities
    # Incidents
    draw_entity(5, 68, 26, 26, "INCIDENTS", [
        "PK Id (int)", "   Title (varchar)", "   Description (text)",
        "   Location (varchar)", "   Priority (varchar)", "   Status (varchar)",
        "   AffectedCount (int)", "   CreatedAt (datetime)"
    ], border_color="#2563eb")

    # Situation Assessments (Student 2)
    draw_entity(39, 68, 28, 26, "SITUATION_ASSESSMENTS", [
        "PK Id (int)", "FK IncidentId (int)", "   UrgencyScore (int)",
        "   UrgencyLevel (varchar)", "   AnalysisSummary (text)", "FK NearestShelterId (int)",
        "   DeficiencyJson (text)", "   CreatedAt (datetime)"
    ], border_color="#0d9488", bg_color="#f0fdfa")

    # Shelters (Student 2)
    draw_entity(73, 68, 27, 26, "SHELTERS", [
        "PK Id (int)", "   Name (varchar)", "   Location (varchar)",
        "   TotalCapacity (int)", "   CurrentOccupancy (int)", "   Status (varchar)",
        "   Latitude (float8)", "   Longitude (float8)"
    ], border_color="#0d9488", bg_color="#f0fdfa")

    # Resources (Student 2)
    draw_entity(73, 34, 27, 26, "RESOURCES", [
        "PK Id (int)", "   Name (varchar)", "   ResourceType (varchar)",
        "   Status (varchar)", "   Capacity (int)", "FK ShelterId (int, null)",
        "   Location (varchar)", "   UpdatedAt (datetime)"
    ], border_color="#0d9488", bg_color="#f0fdfa")

    # Inventory Items (Student 2)
    draw_entity(73, 2, 27, 26, "INVENTORY_ITEMS", [
        "PK Id (int)", "   ItemName (varchar)", "   Category (varchar)",
        "   Quantity (int)", "   MinThreshold (int)", "FK ShelterId (int)",
        "   Status (varchar)", "   UnitOfMeasure (str)"
    ], border_color="#0d9488", bg_color="#f0fdfa")

    # Dispatches
    draw_entity(5, 34, 26, 26, "DISPATCHES", [
        "PK Id (int)", "FK IncidentId (int)", "   Priority (varchar)",
        "   Status (varchar)", "   ApprovedBy (varchar)", "   ApprovedAt (datetime)",
        "   CreatedAt (datetime)", "   UpdatedAt (datetime)"
    ], border_color="#475569")

    # Dispatch Tasks
    draw_entity(39, 34, 28, 26, "DISPATCH_TASKS", [
        "PK Id (int)", "FK DispatchId (int)", "FK VolunteerId (uuid)",
        "FK ResourceId (int)", "   TaskType (varchar)", "   Status (varchar)",
        "   AssignedAt (datetime)"
    ], border_color="#475569")

    # Volunteers
    draw_entity(39, 2, 28, 26, "VOLUNTEERS", [
        "PK Id (uuid)", "   Name (varchar)", "   Email (varchar)",
        "   Phone (varchar)", "   Skills (varchar)", "   IsAvailable (bool)",
        "   CreatedAt (datetime)"
    ], border_color="#64748b")

    # Shifts
    draw_entity(5, 2, 26, 26, "SHIFTS", [
        "PK Id (int)", "FK VolunteerId (uuid)", "   StartTime (datetime)",
        "   EndTime (datetime)", "   Status (varchar)"
    ], border_color="#64748b")

    # Connecting lines & labels
    ax.annotate('1:N', xy=(31, 81), xytext=(39, 81), arrowprops=dict(arrowstyle='<|-', lw=1.2, color='#2563eb'), fontsize=8, fontweight='bold', color='#2563eb')
    ax.annotate('1:N', xy=(18, 68), xytext=(18, 60), arrowprops=dict(arrowstyle='<|-', lw=1.2, color='#334155'), fontsize=8, fontweight='bold')
    ax.annotate('1:N', xy=(31, 47), xytext=(39, 47), arrowprops=dict(arrowstyle='<|-', lw=1.2, color='#334155'), fontsize=8, fontweight='bold')
    ax.annotate('1:N', xy=(53, 34), xytext=(53, 28), arrowprops=dict(arrowstyle='<|-', lw=1.2, color='#334155'), fontsize=8, fontweight='bold')
    ax.annotate('1:N', xy=(39, 15), xytext=(31, 15), arrowprops=dict(arrowstyle='<|-', lw=1.2, color='#334155'), fontsize=8, fontweight='bold')
    ax.annotate('1:N', xy=(86, 68), xytext=(86, 60), arrowprops=dict(arrowstyle='<|-', lw=1.2, color='#0d9488'), fontsize=8, fontweight='bold', color='#0d9488')
    ax.annotate('1:N', xy=(86, 34), xytext=(86, 28), arrowprops=dict(arrowstyle='<|-', lw=1.2, color='#0d9488'), fontsize=8, fontweight='bold', color='#0d9488')

    plt.tight_layout()
    plt.savefig('docs/images/figure2_er_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated figure2_er_diagram.png")

def generate_multi_agent_workflow():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    stages = [
        ("1. Situation Analysis Agent\n(Student 2)", "Calculates Urgency (1-100)\nEvaluates Supply Deficits\nFinds Nearest Shelter", "#0d9488"),
        ("2. Coordinator Planner Agent\n(Student 1)", "Analyzes Severity Scope\nQueries Active Incidents\nDrafts 4-Phase Plan", "#2563eb"),
        ("3. Resource Allocation Agent\n(Student 3)", "Matches Vehicle Types\nFilters Responder Skills\nProposes Task Dispatch", "#7c3aed"),
        ("4. Deterministic Validation Gate\n(Student 4)", "Runs 11 Business Rules\nChecks Double-Bookings\nVerdict: APPROVE/REJECT", "#dc2626"),
        ("5. Human-in-the-Loop Approval\n(Coordinator / Admin)", "Reviews AI Blockers\nAuthorizes Action\nDispatches to Field", "#059669")
    ]

    x_positions = [4, 23.5, 43, 62.5, 82]
    for i, (title, desc, col) in enumerate(stages):
        x = x_positions[i]
        ax.add_patch(patches.FancyBboxPatch((x, 25), 15.5, 50, boxstyle="round,pad=0.8", ec=col, fc="#ffffff", lw=1.5))
        ax.add_patch(patches.FancyBboxPatch((x, 60), 15.5, 15, boxstyle="round,pad=0.5", ec=col, fc=col, lw=1.2))
        ax.text(x + 7.75, 67.5, title, fontsize=8, fontweight='bold', ha='center', va='center', color="#ffffff")
        ax.text(x + 7.75, 42, desc, fontsize=7.2, ha='center', va='center', color="#1e293b", linespacing=1.4)

        if i < 4:
            next_x = x_positions[i+1]
            ax.annotate('', xy=(next_x - 0.5, 50), xytext=(x + 15.5 + 0.5, 50),
                        arrowprops=dict(arrowstyle='->', lw=2, color='#475569'))

    ax.text(50, 90, "Automated Disaster Response & Human-in-the-Loop Orchestration Pipeline", fontsize=11, fontweight='bold', ha='center', color="#0f172a")

    plt.tight_layout()
    plt.savefig('docs/images/figure3_agent_orchestration.png', bbox_inches='tight')
    plt.close()
    print("Generated figure3_agent_orchestration.png")

def generate_test_distribution():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), dpi=300)

    # Bar chart
    categories = ['Backend xUnit\n(.NET 8)', 'Flutter Widget\n& Unit Tests', 'React Vitest\n(Web UI)']
    counts = [80, 91, 26]
    colors = ['#2563eb', '#0284c7', '#0d9488']

    bars = ax1.bar(categories, counts, color=colors, width=0.55, edgecolor='#1e293b', linewidth=1)
    ax1.set_ylabel('Number of Automated Tests Passed', fontsize=9, fontweight='bold', color='#1e293b')
    ax1.set_title('Test Suite Count by Subsystem (Total: 197 Tests)', fontsize=10, fontweight='bold', color='#0f172a')
    ax1.grid(axis='y', linestyle='--', alpha=0.4)
    ax1.set_ylim(0, 110)

    for bar in bars:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 2.5, f"{int(yval)} Tests\n(100% Pass)", ha='center', va='bottom', fontsize=8.5, fontweight='bold')

    # Pie chart
    ax2.pie(counts, labels=['.NET API (40.6%)', 'Flutter (46.2%)', 'React (13.2%)'], colors=colors, autopct='%1.0f%%',
            startangle=140, textprops={'fontsize': 8.5, 'fontweight': 'bold'}, wedgeprops=dict(edgecolor='#1e293b', linewidth=1))
    ax2.set_title('Proportional Quality Coverage Across Stack', fontsize=10, fontweight='bold', color='#0f172a')

    plt.tight_layout()
    plt.savefig('docs/images/figure4_test_distribution.png', bbox_inches='tight')
    plt.close()
    print("Generated figure4_test_distribution.png")

if __name__ == '__main__':
    generate_system_architecture()
    generate_er_diagram()
    generate_multi_agent_workflow()
    generate_test_distribution()
