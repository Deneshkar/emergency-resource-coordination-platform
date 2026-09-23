# Emergency Resource Coordination Platform (ERCP)

An Integrated Full-Stack and Agentic AI Application for real-time disaster management and emergency resource coordination. 

This platform allows dispatchers, emergency coordinators, volunteers, and citizens to seamlessly collaborate during crises. It leverages **Agentic AI** to autonomously analyze incident telemetry, allocate resources, and draft tactical emergency response plans.

## Team
- **Student 1** — Incident Management + Coordinator/Planner Agent
- **Student 2** — Resource & Inventory Management + Situation Analysis Agent
- **Student 3** — Dispatch & Task Assignment + Resource Allocation Agent
- **Student 4** — Volunteer/Responder Management + Validation/Safety Agent

---

## 🛠 Technology Stack
- **Backend:** C# / ASP.NET Core 8 Web API
- **Frontend:** React + Vite
- **Mobile:** Flutter (in `/mobile-flutter`)
- **Database:** PostgreSQL (with Entity Framework Core)
- **AI Integration:** Python 3 + Google Gemini AI (via CLI Agents)

---

## 👥 User Roles
- **Citizen:** Can report new emergency incidents and view public safety updates.
- **Volunteer:** Field responders who can update their availability, accept shifts, and receive tactical field assignments.
- **Coordinator:** Operational commanders who dispatch resources, oversee incidents, and interact with the AI Planning Agent.
- **Admin:** System administrators who manage users, roles, and global inventory.

---

## 🤖 Incident Intelligence & AI Agents

The platform features an autonomous AI subsystem located in `/ai-agents` that integrates directly with the C# backend.
- **Incident Summary & Risk Assessment:** Automatically analyzes citizen reports to gauge threat levels.
- **Duplicate Detection:** Flags overlapping incident reports to prevent resource waste.
- **Coordinator / Planner Agent:** An advanced ReAct agent that:
  - Consumes live database telemetry (Available Vehicles, Available Volunteers).
  - Drafts a structured 4-phase tactical dispatch plan.
  - Mitigates hallucinations by verifying actual inventory availability.
  - Submits the plan for **Human Approval** before any field dispatch occurs.

---

## 🚀 Setup Instructions

### 1. Environment Configuration

Copy the example configuration file and set your credentials:
```bash
cp .env.example .env
```
Inside your `.env` (or set as system environment variables):
- `GEMINI_API_KEY`: Your Google Gemini API Key (required for AI features).
- `Jwt__SecretKey`: A secure random string (minimum 32 characters) for token signing.
- `ConnectionStrings__DefaultConnection`: Your PostgreSQL connection string. 
  *(Note: If PostgreSQL is not available, the app safely falls back to an InMemory database).*

### 2. Backend Setup
1. Ensure **.NET 8 SDK** is installed.
2. Navigate to the backend:
```bash
cd backend
```
3. Run the application:
```bash
dotnet run
```
The API and Swagger UI will be available at `http://localhost:5009/swagger`.

### 3. Frontend Setup
1. Ensure **Node.js** (v18+) is installed.
2. Navigate to the frontend directory:
```bash
cd frontend-react
```
3. Install dependencies:
```bash
npm install
```
4. Start the Vite dev server:
```bash
npm run dev
```

### 4. Database Seeding & Testing
If you are running the default **InMemory Database**, the database wipes on restart.
To test the AI Coordinator properly:
1. Log in or use Swagger to create at least one `Resource` (e.g. Fire Engine).
2. Create at least one `Volunteer` and set their status to Available.
3. Open an Incident and trigger the AI Coordinator Workbench to see real data flow into the Agent's reasoning logs.

### 5. Running Automated Tests
The backend has comprehensive xUnit test coverage ensuring core validation, agent payload mapping, and JWT authorization rules are enforced.
```bash
dotnet test backend-tests/ERCP.Api.Tests.csproj
```

---

## 🔐 Authentication & JWT
The system uses JWT (JSON Web Tokens) for role-based authorization.
- When testing via **Swagger UI**, simply paste your raw token into the Authorize prompt (the `Bearer ` prefix is handled automatically).
- The `VolunteersController` and specific operational endpoints enforce `[Authorize(Roles = "Coordinator,Admin,Volunteer")]`.

---

## ⚠️ Security Notice
The `appsettings.json` file contains a dummy development JWT key and database password. **Never use these default placeholders in production.** Always override them via Environment Variables. Git history prior to Finalization may contain development credentials; these should be considered compromised and rotated if applicable to any real infrastructure.
