# Emergency Resource Coordination Platform

SE3090 Assignment — Integrated Full-Stack and Agentic AI Application

## Team

- Student 1 — Incident Management + Coordinator/Planner Agent
- Student 2 — Resource & Inventory Management + Situation Analysis Agent
- Student 3 — Dispatch & Task Assignment + Resource Allocation Agent
- Student 4 — Volunteer/Responder Management + Validation/Safety Agent

## Structure

- `/backend` — ASP.NET Core Web API (.NET 8)
- `/frontend-react` — React + Vite web app
- `/mobile-flutter` — Flutter mobile app
- `/ai-agents` — Agentic AI subsystem
- `/docs` — ER diagrams, ADRs, reports

---

## 🚀 Local Development Setup (Team Members)

### Prerequisites — ஒரே ஒரு தடவை install பண்ணணும்

| Tool | Download Link | Check |
|------|--------------|-------|
| .NET 8 SDK | https://dotnet.microsoft.com/download/dotnet/8.0 | `dotnet --version` |
| Node.js 18+ | https://nodejs.org | `node --version` |
| Git | https://git-scm.com | `git --version` |

---

### Step 1 — Clone the Repo

```bash
git clone https://github.com/Deneshkar/emergency-resource-coordination-platform.git
cd emergency-resource-coordination-platform
```

---

### Step 2 — Run Backend

```bash
cd backend
dotnet run
```

✅ Backend starts at: **http://localhost:5009**  
✅ Swagger UI at: **http://localhost:5009/swagger**  
✅ No database setup needed — auto uses InMemory DB locally!

---

### Step 3 — Run Frontend (new terminal)

```bash
cd frontend-react
npm install
npm run dev
```

✅ Frontend starts at: **http://localhost:5173**

---

### 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@ercp.org | Admin@123 |
| 🎯 Coordinator | coordinator@ercp.org | Coord@123 |
| 🙋 Volunteer | volunteer@ercp.org | Vol@123 |
| 👤 Citizen | citizen@ercp.org | Citizen@123 |

---

### 📌 How It Works Locally vs Production

| | Local (Your PC) | Production (Railway) |
|--|----------------|---------------------|
| **Database** | InMemory (auto) | PostgreSQL (Railway) |
| **Data persists?** | ❌ Resets on restart | ✅ Permanent |
| **Setup needed?** | None | Railway deploys auto |
| **URL** | localhost:5173 | Railway domain |

> **Note:** No `.env` file needed locally. The backend auto-detects the database — if Railway PostgreSQL is reachable, it uses that; otherwise it falls back to InMemory automatically.

---

### 🌿 Git Branching Strategy

Each team member works on their own feature branch:

```bash
# Before starting work — pull latest
git pull origin main

# Switch to your branch
git checkout <your-branch-name>

# After changes — push
git add .
git commit -m "Your message"
git push
```

---

### ⚙️ Railway Production Deployment

Production is auto-deployed via Railway when code is pushed.

**Environment Variables (set in Railway Dashboard):**
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}   ← auto from Railway Postgres
ASPNETCORE_ENVIRONMENT = Production
ASPNETCORE_URLS = http://0.0.0.0:${{PORT}}
```

These are already configured in `backend/railway.toml` — no manual action needed.

---

### ❓ Troubleshooting

**Backend port conflict?**
```bash
# Change port in backend/Properties/launchSettings.json
```

**Frontend can't reach backend?**
- Make sure backend is running on port 5009
- Check `frontend-react/src` for API base URL config

**node_modules missing?**
```bash
cd frontend-react
npm install
```
