# Architecture Decision Record (ADR)
## ADR 02: Database Schema Strategy for Resource & Inventory Management & Situation Analysis Agent

- **Status**: Approved
- **Deciders**: Team / Student 2
- **Date**: 2026-09-10

### Context & Problem Statement
The Emergency Resource Coordination Platform requires tracking emergency supplies, vehicles, equipment, and shelter capacities across dispersed locations. Furthermore, the **Situation Analysis AI Agent** needs to consume real-time inventory and incident state to compute urgency scores, gap analyses, and nearest shelter matches without causing performance bottlenecks or invalid state transitions.

### Decision Drivers
1. **Data Integrity & Relational Rules**: Prevent over-allocation of shelter capacity or orphan resources.
2. **AI Subsystem Integration**: The Agentic AI workflow requires structured input data (incidents + inventory) and must persist its decision audit trail in PostgreSQL.
3. **Mandatory Technology Stack**: C# ASP.NET Core API + PostgreSQL (EF Core).

### Considered Options
- Option 1: Store resource/inventory data as unstructured JSON documents inside PostgreSQL.
- Option 2: Strictly normalized relational schema for Shelters, Resources, and InventoryItems, paired with a dedicated `SituationAssessment` audit table for the AI Agent.

### Decision Outcome
Chosen Option: **Option 2**.

#### Justification:
- **Normalized relational tables** enforce foreign key integrity (`Shelter 1 -> Many Resources`, `Shelter 1 -> Many InventoryItems`).
- `SituationAssessment` persists the AI agent's execution output (UrgencyScore, UrgencyLevel, AnalysisSummary, ResourceDeficiencyJson) as an immutable record linked to `IncidentId`.
- ASP.NET Core `SituationAnalysisService` implements allow-listed tools (`CalculateUrgencyScore`, `EvaluateInventoryDeficiencies`, `FindBestAvailableShelterAsync`) returning structured DTOs to React and Flutter clients.

### Consequences
- Good: Full compliance with assignment spec requiring relational integrity, schema migrations, and persisted AI agent workflow state.
- Good: Both React and Flutter client apps consume the exact same ASP.NET Core REST API endpoints.
- Mitigation: In-memory unit tests in `backend-tests` ensure fast CI test execution.

---

## ADR 02.1: Third-Party Geolocation & Maps API Routing Strategy

- **Status**: Approved
- **Deciders**: Student 2 (Resource & Inventory Lead)
- **Date**: 2026-09-16

### Context & Problem Statement
The platform must calculate proximity to evacuation shelters and emergency resources to allow rapid response dispatching and citizen evacuation guidance. A third-party maps/geolocation API integration is required by project guidelines.

### Decision Outcome
- Implemented **Haversine Great-Circle Distance Algorithm** in `GeolocationService.cs` to calculate precise real-time distances (km) and estimated travel times (minutes) between emergency incidents and active shelters.
- Integrated **OpenStreetMap Nominatim Geocoding API** (`https://nominatim.openstreetmap.org/search`) via ASP.NET Core `HttpClient` for resolving location address strings to latitude/longitude coordinates.
- Rendered OpenStreetMap interactive navigation links (`https://www.openstreetmap.org/search?query=...`) in React (`ShelterList.jsx`) and Flutter (`shelter_locator_screen.dart`).

