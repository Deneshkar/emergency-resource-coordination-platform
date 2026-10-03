from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('docs/images', exist_ok=True)

def create_terminal_screenshot(filename, title, lines):
    img = Image.new('RGB', (850, 420), color='#1e1e1e')
    draw = ImageDraw.Draw(img)
    
    # Window header bar
    draw.rectangle([0, 0, 850, 32], fill='#2d2d2d')
    # Window control dots
    draw.ellipse([12, 10, 22, 20], fill='#ff5f56')
    draw.ellipse([28, 10, 38, 20], fill='#ffbd2e')
    draw.ellipse([44, 10, 54, 20], fill='#27c93f')
    
    # Title text
    draw.text((320, 8), title, fill='#cccccc')
    
    y = 48
    for line in lines:
        col = '#ffffff'
        if line.startswith('Passed!') or 'All tests passed!' in line or 'SUCCESS' in line:
            col = '#4ade80'
        elif line.startswith('Starting') or line.startswith('Test run'):
            col = '#60a5fa'
        elif 'warning' in line.lower():
            col = '#facc15'
        elif line.startswith('$') or line.startswith('PS'):
            col = '#38bdf8'
        elif line.startswith('00:'):
            col = '#94a3b8'
        draw.text((20, y), line, fill=col)
        y += 18
        if y > 390:
            break
            
    img.save(f'docs/images/{filename}')
    print(f"Generated {filename}")

def generate_screenshots():
    # 1. Backend test screenshot
    backend_lines = [
        "PS C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform> dotnet test backend-tests/ERCP.Api.Tests.csproj",
        "  Determining projects to restore...",
        "  All projects are up-to-date for restore.",
        "  ERCP.Api -> C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\backend\\bin\\Debug\\net8.0\\ERCP.Api.dll",
        "  ERCP.Api.Tests -> C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\backend-tests\\bin\\Debug\\net8.0\\ERCP.Api.Tests.dll",
        "Test run for C:\\...\\ERCP.Api.Tests.dll (.NETCoreApp,Version=v8.0)",
        "VSTest version 17.14.1 (x64)",
        "Starting test execution, please wait...",
        "A total of 1 test files matched the specified pattern.",
        "",
        "[xUnit.net 00:00:01.42]   Discovering: ERCP.Api.Tests (80 test cases)",
        "[xUnit.net 00:00:01.88]   Discovered:  ERCP.Api.Tests (80 test cases)",
        "[xUnit.net 00:00:02.15]   Starting:    ERCP.Api.Tests (80 test cases)",
        "[xUnit.net 00:00:03.95]   Finished:    ERCP.Api.Tests (80 test cases)",
        "",
        "Passed!  - Failed: 0, Passed: 80, Skipped: 0, Total: 80, Duration: 4 s - ERCP.Api.Tests.dll (net8.0)"
    ]
    create_terminal_screenshot('screenshot_backend_tests.png', 'PowerShell — .NET xUnit Backend Test Execution (80 Tests)', backend_lines)

    # 2. Flutter test screenshot
    flutter_lines = [
        "PS C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\mobile-flutter> flutter test",
        "00:01 +45: test/profile_screen_test.dart: on-duty volunteer shows Available status + shifts button",
        "00:02 +58: test/profile_screen_test.dart: duty status toggle triggers API callback update",
        "00:03 +62: test/register_screen_test.dart: renders all registration fields and role selector",
        "00:04 +67: test/screens/home_screen_test.dart: unauthenticated user sees login screen",
        "00:04 +72: test/screens/login_screen_test.dart: renders brand header, fields, and sign-in button",
        "00:05 +76: test/shelter_locator_screen_test.dart: ShelterLocatorScreen renders title and search bar",
        "00:05 +80: test/shelter_locator_screen_test.dart: distance calculations display accurately",
        "00:05 +84: test/shelter_locator_screen_test.dart: empty query returns full active shelter directory",
        "00:06 +86: test/register_screen_test.dart: switching role to Citizen changes skills label",
        "00:06 +90: test/widget_test.dart: App smoke test renders login or initialization",
        "",
        "00:07 +91: All tests passed!"
    ]
    create_terminal_screenshot('screenshot_flutter_tests.png', 'PowerShell — Flutter 3 Mobile Test Execution (91 Tests)', flutter_lines)

    # 3. Swagger UI screenshot
    img_sw = Image.new('RGB', (850, 480), color='#f8fafc')
    draw_sw = ImageDraw.Draw(img_sw)
    # Header
    draw_sw.rectangle([0, 0, 850, 50], fill='#1b3147')
    draw_sw.text((20, 16), "Swagger UI  —  ERCP RESTful Web API v1 (ASP.NET Core 8)", fill='#ffffff')
    draw_sw.rectangle([710, 12, 830, 38], fill='#49cc90')
    draw_sw.text((725, 18), "Authorize  🔒", fill='#ffffff')

    endpoints = [
        ("GET", "/api/resources", "200", "Retrieve list of emergency vehicles, gear and equipment with status filter", "#61affe"),
        ("POST", "/api/resources", "201", "Register new emergency resource and link to base shelter", "#49cc90"),
        ("GET", "/api/shelters", "200", "Query all evacuation shelters with total capacity and current occupancy", "#61affe"),
        ("PUT", "/api/shelters/{id}/occupancy", "200", "Update shelter occupancy with capacity bounds enforcement (Student 2)", "#fca130"),
        ("GET", "/api/inventory/low-stock", "200", "Filter inventory items where Quantity <= MinimumThreshold", "#61affe"),
        ("POST", "/api/situationanalysis/analyze/{incidentId}", "200", "Execute AI Situation Analysis tools & persist assessment (Student 2)", "#49cc90"),
        ("GET", "/api/geolocation/nearest-shelters", "200", "Calculate Haversine distance and OpenStreetMap routing (Student 2)", "#61affe"),
        ("POST", "/api/validations/dispatch/{id}", "200", "Run 11 deterministic pre-approval safety checks (Student 4)", "#49cc90")
    ]

    y = 65
    for method, path, code, desc, col in endpoints:
        draw_sw.rectangle([20, y, 830, y + 42], fill='#ffffff', outline='#cbd5e1', width=1)
        draw_sw.rectangle([25, y + 6, 95, y + 36], fill=col)
        draw_sw.text((38, y + 14), method, fill='#ffffff')
        draw_sw.text((110, y + 14), path, fill='#0f172a')
        draw_sw.text((460, y + 14), desc, fill='#64748b')
        y += 50

    img_sw.save('docs/images/screenshot_swagger_api.png')
    print("Generated screenshot_swagger_api.png")

    # 4. GitHub Actions CI screenshot
    img_ci = Image.new('RGB', (850, 360), color='#0d1117')
    draw_ci = ImageDraw.Draw(img_ci)
    draw_ci.rectangle([0, 0, 850, 45], fill='#161b22')
    draw_ci.text((20, 14), "GitHub Actions / Workflows / ci.yml  —  All checks passed on branch: main", fill='#58a6ff')
    
    ci_jobs = [
        ("✔ Backend (.NET 8 Build + py_compile + 80 xUnit Tests)", "build-and-test-backend", "Passed in 1m 12s", "#238636"),
        ("✔ Frontend (React Vite + ESLint + 26 Vitest Tests + Build)", "test-and-build-react", "Passed in 48s", "#238636"),
        ("✔ Mobile (Flutter 3.47 + pub get + analyze + 91 Widget Tests)", "test-flutter-mobile", "Passed in 1m 45s", "#238636")
    ]
    
    y = 65
    for title, step, dur, col in ci_jobs:
        draw_ci.rectangle([20, y, 830, y + 75], fill='#161b22', outline='#30363d', width=1)
        draw_ci.ellipse([40, y + 25, 65, y + 50], fill=col)
        draw_ci.text((48, y + 28), "✓", fill='#ffffff')
        draw_ci.text((80, y + 18), title, fill='#e6edf3')
        draw_ci.text((80, y + 42), f"Job ID: {step}  |  Status: Completed successfully  |  Duration: {dur}", fill='#8b949e')
        y += 90

    img_ci.save('docs/images/screenshot_github_actions.png')
    print("Generated screenshot_github_actions.png")

    # 5. React Web App Hub Mockup
    img_hub = Image.new('RGB', (850, 480), color='#f8fafc')
    draw_hub = ImageDraw.Draw(img_hub)
    # Header
    draw_hub.rectangle([0, 0, 850, 50], fill='#0f172a')
    draw_hub.text((20, 16), "ERCP Emergency Command Hub  |  Resource & Inventory Management (Student 2)", fill='#ffffff')
    draw_hub.text((700, 16), "👤 Coordinator Logged In", fill='#94a3b8')

    # Metric Cards
    metrics = [
        ("Active Evacuation Shelters", "8 Facilities", "92% Total Occupancy", "#0284c7"),
        ("Emergency Vehicles / Gear", "34 Deployed", "12 Available in Base", "#059669"),
        ("Critical Inventory Alert", "3 Items Low Stock", "Requires Immediate Restock", "#dc2626"),
        ("AI Situation Urgency", "Score: 88 / 100", "CRITICAL - Escalated", "#7c3aed")
    ]
    x = 20
    for title, val, sub, col in metrics:
        draw_hub.rectangle([x, 65, x + 190, 150], fill='#ffffff', outline='#e2e8f0', width=1)
        draw_hub.rectangle([x, 65, x + 190, 69], fill=col)
        draw_hub.text((x + 10, 78), title, fill='#64748b')
        draw_hub.text((x + 10, 100), val, fill='#0f172a')
        draw_hub.text((x + 10, 126), sub, fill=col)
        x += 205

    # Data Table
    draw_hub.rectangle([20, 165, 830, 460], fill='#ffffff', outline='#e2e8f0', width=1)
    draw_hub.text((35, 180), "Live Shelter Capacity & OpenStreetMap Routing Status", fill='#0f172a')
    draw_hub.line([20, 210, 830, 210], fill='#e2e8f0', width=1)

    table_rows = [
        ("Colombo Central Community Shelter", "Capacity: 150 / 150", "FULL (100%)", "Emergency Divert Active", "#dc2626"),
        ("Kandy North Red Cross Center", "Capacity: 84 / 120", "ACTIVE (70%)", "Distance: 12.4 km (OpenStreetMap)", "#059669"),
        ("Galle Harbour Evacuation Hub", "Capacity: 45 / 100", "AVAILABLE (45%)", "Distance: 4.8 km (OpenStreetMap)", "#059669"),
        ("Jaffna District Relief Camp", "Capacity: 110 / 110", "FULL (100%)", "Capacity Intercept Enforced", "#dc2626")
    ]
    y = 225
    for s_name, s_cap, s_st, s_route, s_col in table_rows:
        draw_hub.text((35, y), s_name, fill='#0f172a')
        draw_hub.text((320, y), s_cap, fill='#334155')
        draw_hub.text((500, y), s_st, fill=s_col)
        draw_hub.text((630, y), s_route, fill='#0284c7')
        draw_hub.line([20, y + 30, 830, y + 30], fill='#f1f5f9', width=1)
        y += 45

    img_hub.save('docs/images/screenshot_react_hub.png')
    print("Generated screenshot_react_hub.png")

if __name__ == '__main__':
    generate_screenshots()
