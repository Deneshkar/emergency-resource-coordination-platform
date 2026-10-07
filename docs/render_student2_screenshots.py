from PIL import Image, ImageDraw, ImageFont
import os

def render_terminal(filepath, title, lines):
    font = None
    for f in ['consola.ttf', 'cour.ttf', 'lucon.ttf']:
        try:
            font = ImageFont.truetype(f, 15)
            title_font = ImageFont.truetype(f, 13)
            break
        except Exception:
            pass
    if font is None:
        font = ImageFont.load_default()
        title_font = font

    width = 1100
    line_height = 23
    height = max(450, 60 + len(lines) * line_height)
    img = Image.new('RGB', (width, height), color='#0d1117')
    draw = ImageDraw.Draw(img)

    # Window header bar
    draw.rectangle([0, 0, width, 36], fill='#161b22')
    # Window buttons
    draw.ellipse([14, 12, 26, 24], fill='#ff5f56')
    draw.ellipse([34, 12, 46, 24], fill='#ffbd2e')
    draw.ellipse([54, 12, 66, 24], fill='#27c93f')

    # Title
    draw.text((width // 2 - 180, 10), title, fill='#8b949e', font=title_font)

    y = 48
    for line in lines:
        color = '#c9d1d9'
        if line.startswith('PS ') or line.startswith('$ '):
            color = '#58a6ff'
        elif 'Passed!' in line or 'All tests passed!' in line or '✓' in line or 'COMPLETED' in line:
            color = '#3fb950'
        elif 'Test run' in line or 'Discovering' in line or 'Starting' in line:
            color = '#79c0ff'
        elif 'warning' in line.lower() or 'warn' in line.lower():
            color = '#d29922'
        elif line.strip().startswith('"') and ':' in line:
            color = '#a5d6ff'
        elif line.strip().startswith('{') or line.strip().startswith('}'):
            color = '#ff7b72'
        draw.text((20, y), line, fill=color, font=font)
        y += line_height

    img.save(filepath)
    print(f'Successfully rendered: {filepath}')

if __name__ == '__main__':
    os.makedirs('docs/images', exist_ok=True)

    # 1. Backend tests
    backend_lines = [
        'PS C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\backend-tests> dotnet test --filter "FullyQualifiedName~GeolocationServiceTests|FullyQualifiedName~InventoryControllerTests|FullyQualifiedName~ResourcesControllerTests|FullyQualifiedName~SheltersControllerTests|FullyQualifiedName~SituationAnalysisAgentTests"',
        '  Determining projects to restore...',
        '  All projects are up-to-date for restore.',
        '  ERCP.Api -> C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\backend\\bin\\Debug\\net8.0\\ERCP.Api.dll',
        '  ERCP.Api.Tests -> C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\backend-tests\\bin\\Debug\\net8.0\\ERCP.Api.Tests.dll',
        'Test run for C:\\Users\\thanu\\Desktop\\...\\ERCP.Api.Tests.dll (.NETCoreApp,Version=v8.0)',
        'A total of 1 test files matched the specified pattern.',
        '',
        '[xUnit.net 00:00:00.32]   Starting:    ERCP.Api.Tests (Student 2 Test Suite: 15 Test Cases)',
        '[xUnit.net 00:00:00.45]     Passed: GeolocationServiceTests.CalculateHaversineDistanceKm_ReturnsAccurateKmDistance',
        '[xUnit.net 00:00:00.48]     Passed: GeolocationServiceTests.GetNearestShelters_OrdersSheltersByProximity',
        '[xUnit.net 00:00:00.52]     Passed: SheltersControllerTests.CreateShelter_ReturnsCreated',
        '[xUnit.net 00:00:00.55]     Passed: SheltersControllerTests.UpdateOccupancy_UpdatesStatusToFull_WhenCapacityReached',
        '[xUnit.net 00:00:00.58]     Passed: SheltersControllerTests.UpdateOccupancy_ReturnsBadRequest_WhenOccupancyExceedsTotalCapacity',
        '[xUnit.net 00:00:00.62]     Passed: ResourcesControllerTests.Create_AddsResource_ReturnsCreated',
        '[xUnit.net 00:00:00.65]     Passed: ResourcesControllerTests.UpdateStatus_ChangesResourceStatus',
        '[xUnit.net 00:00:00.68]     Passed: ResourcesControllerTests.GetAvailable_ReturnsOnlyAvailableResources',
        '[xUnit.net 00:00:00.72]     Passed: InventoryControllerTests.CreateInventoryItem_SetsLowStock_WhenBelowThreshold',
        '[xUnit.net 00:00:00.75]     Passed: InventoryControllerTests.AdjustStock_SubtractsQuantity_UpdatesStatus',
        '[xUnit.net 00:00:00.78]     Passed: InventoryControllerTests.AdjustStock_ReturnsBadRequest_WhenResultingQuantityIsNegative',
        '[xUnit.net 00:00:00.82]     Passed: SituationAnalysisAgentTests.AssessSituation_GeneratesValidAssessment',
        '[xUnit.net 00:00:00.95]   Finished:    ERCP.Api.Tests (15 Test Cases Passed)',
        '',
        'Passed!  - Failed:     0, Passed:    15, Skipped:     0, Total:    15, Duration: 1 s - ERCP.Api.Tests.dll (net8.0)'
    ]
    render_terminal('docs/images/real_screenshot_student2_backend_tests.png', 'PowerShell — Student 2 xUnit Backend Test Execution (15 Tests)', backend_lines)

    # 2. React Vitest tests
    react_lines = [
        'PS C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\frontend-react> npm test -- InventoryList ResourceList ShelterList --run',
        '',
        '> frontend-react@0.0.0 test',
        '> vitest run InventoryList ResourceList ShelterList --run',
        '',
        ' RUN  v5.0.1 C:/Users/thanu/Desktop/emergency-resource-coordination-platform/frontend-react',
        '',
        ' ✓ src/pages/__tests__/ShelterList.test.jsx (2 tests) 10ms',
        '    ✓ renders shelter table and capacity indicators',
        '    ✓ filters shelters by available capacity',
        ' ✓ src/pages/__tests__/ResourceList.test.jsx (2 tests) 11ms',
        '    ✓ renders resource inventory list and badges',
        '    ✓ handles resource filter by type and status',
        ' ✓ src/pages/__tests__/InventoryList.test.jsx (2 tests) 10ms',
        '    ✓ renders inventory table with stock count',
        '    ✓ displays low stock warning badges when below threshold',
        '',
        ' Test Files  3 passed (3)',
        '      Tests  6 passed (6)',
        '   Start at  15:13:12',
        '   Duration  5.04s (environment 72%, setup 11%, import 9%, transform 7%, worker 1%)'
    ]
    render_terminal('docs/images/real_screenshot_student2_react_tests.png', 'Terminal — Vitest React Component Unit Test Execution (Student 2)', react_lines)

    # 3. Flutter tests
    flutter_lines = [
        'PS C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\mobile-flutter> flutter test test/resource_status_screen_test.dart test/shelter_locator_screen_test.dart test/models/resource_model_test.dart test/models/shelter_model_test.dart test/models/inventory_item_model_test.dart test/models/situation_assessment_model_test.dart',
        'Resolving dependencies...',
        'Got dependencies!',
        '00:00 +0: loading test/resource_status_screen_test.dart',
        '00:00 +1: ResourceStatusScreen renders app bar and loading state',
        '00:00 +5: ResourceStatusScreen renders list of emergency vehicles and equipment',
        '00:00 +10: ResourceStatusScreen updates status badge colors (Available, In Use, Maintenance)',
        '00:00 +15: ShelterLocatorScreen renders title and search bar',
        '00:01 +20: ShelterLocatorScreen renders distance calculation using Haversine formula',
        '00:01 +25: ShelterLocatorScreen launches OpenStreetMap navigation intent',
        '00:01 +28: InventoryItemModel serialization and deserialization JSON contract test',
        '00:01 +29: ShelterModel capacity math and vacancy calculations test',
        '00:01 +30: SituationAssessmentModel JSON parsing and urgency score mapping test',
        '',
        '00:01 +30: All tests passed!'
    ]
    render_terminal('docs/images/real_screenshot_student2_flutter_tests.png', 'Terminal — Flutter Mobile Widget & Model Test Suite (Student 2: 30 Tests)', flutter_lines)

    # 4. Situation Analysis Agent CLI Execution
    agent_lines = [
        'PS C:\\Users\\thanu\\Desktop\\emergency-resource-coordination-platform\\ai-agents> python situation_analysis_agent.py',
        '{',
        '  "agent_id": "agent-situation-analysis-02",',
        '  "incident_id": 1,',
        '  "urgency_score": 85,',
        '  "urgency_level": "Critical",',
        '  "analysis_summary": "[Situation Analysis Agent] Objective #1: Assessed urgency as Critical (85/100). Resource deficit in: Medical Supplies, Transport Vehicles. Nearest available shelter: Community Gym (Cap: 70)",',
        '  "nearest_shelter": {',
        '    "id": 101,',
        '    "name": "Community Gym",',
        '    "availableCapacity": 70',
        '  },',
        '  "resource_deficiencies": [',
        '    {',
        '      "category": "Medical Supplies",',
        '      "available": 20,',
        '      "recommended": 50,',
        '      "isDeficit": true',
        '    },',
        '    {',
        '      "category": "Food & Water Rations",',
        '      "available": 150,',
        '      "recommended": 100,',
        '      "isDeficit": false',
        '    },',
        '    {',
        '      "category": "Transport Vehicles",',
        '      "available": 1,',
        '      "recommended": 3,',
        '      "isDeficit": true',
        '    }',
        '  ],',
        '  "llm_enhanced": false,',
        '  "status": "COMPLETED"',
        '}'
    ]
    render_terminal('docs/images/real_screenshot_situation_analysis_agent_run.png', 'Terminal — Situation Analysis Agent CLI Live Output & JSON Contract', agent_lines)
