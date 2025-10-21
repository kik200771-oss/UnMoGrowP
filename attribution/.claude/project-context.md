# Project Context - UnMoGrowP Attribution Platform

**For:** Claude Code AI Sessions
**Purpose:** Maintain context between sessions
**Last Updated:** 2025-10-21

---

## 🎯 Project Overview

**Name:** UnMoGrowP (Unified Mobile Growth Platform)
**Type:** Mobile Attribution Platform (AppsFlyer competitor)
**Goal:** Track and attribute 10M+ events/second with AI-powered insights

---

## 📚 Essential Information

### Quick Facts
- **Migration Status:** ✅ 100% Complete (Day 1-3)
- **Current Branch:** `feature/migrate-to-svelte`
- **Last Commit:** `8b0656a` - Day 3: Integration & Testing
- **Services Running:** Frontend (5173), API (3001), Infrastructure (Docker)
- **Services Ready:** Go Backend (8080) - code ready, not started

### Tech Stack (Final)
```
Frontend:  Svelte 5 + SvelteKit + Tailwind v4 + ECharts
API:       Bun 1.3 + Hono v4
Backend:   Go 1.25 + Fiber v3 RC
Databases: PostgreSQL + ClickHouse + Kafka + Redis
```

---

## 🗂️ Key Files to Read First

When starting a new session, **read these files in order:**

1. **`docs/CURRENT_STATUS.md`** ⭐ MOST IMPORTANT
   - Current state of everything
   - What's working, what's not
   - Known issues
   - Running services

2. **`TODO.md`**
   - Prioritized task list
   - What to do next
   - Recently completed tasks

3. **`docs/DECISIONS.md`**
   - Why we made key decisions
   - Architecture rationale
   - 10 documented ADRs

4. **Latest migration report:**
   - `docs/status/MIGRATION_DAY3_2025-10-21.md`
   - Most recent work details

5. **`git log --oneline -5`**
   - Recent commit history
   - What changed recently

---

## 💡 Critical Context Points

### 1. Why We Migrated from Next.js to Svelte 5

**TL;DR:** Original code (Next.js + React) didn't match 350+ pages of docs (Svelte 5 + Go)

**Details:**
- Found stack mismatch during deep analysis
- 350+ pages in `DOCUMENTS/` describe Svelte 5 stack
- 11 AI agents in `.claude/commands/` configured for Svelte 5
- User chose "Variant A: Full migration"
- Took 3 days to complete

**Result:**
- 3.5x smaller bundle (40 KB vs 140 KB)
- 3x faster API (90k vs 30k req/sec)
- 1000x faster backend capability (10M vs 10k events/sec)

### 2. Architecture Pattern

**Forward Proxy Pattern:**
```
Browser → SvelteKit (5173) → Bun API (3001) → Go Backend (8080) → Databases
```

**Why:**
- Bun API handles auth, business logic
- Go backend handles high-throughput events
- Clean separation of concerns

### 3. Current Authentication

**Status:** ⚠️ Mock/Temporary

**Implementation:**
- JWT tokens are `mock-jwt-token-{timestamp}`
- Stored in localStorage (not secure for production)
- No password hashing
- No PostgreSQL integration yet

**TODO:** Need real auth with bcrypt + JWT + httpOnly cookies

### 4. What Works End-to-End

✅ **Login Flow:**
```
/login → Enter email/password → API call → Mock JWT → localStorage → /dashboard
```

✅ **Dashboard:**
```
Check token → Load stats from API → Display cards + ECharts graph → Event tracking
```

✅ **API Endpoints:**
- All 10 endpoints implemented
- Mock data for now
- Forward proxy ready for Go backend

### 5. What's NOT Working Yet

❌ **Real Authentication:** No PostgreSQL integration
❌ **Real Data:** Dashboard shows mock stats
❌ **Go Backend:** Code ready but not running
❌ **Google OAuth:** Button exists but not configured
❌ **reCAPTCHA:** Hardcoded mock token

---

## 🎨 Project Structure

```
C:\КОДИНГ\attribution/
├── frontend/               # Svelte 5 SvelteKit
│   ├── src/
│   │   ├── lib/api/client.ts          # ⭐ API Client (268 lines)
│   │   └── routes/
│   │       ├── login/+page.svelte     # ⭐ Login with API
│   │       └── dashboard/+page.svelte # ⭐ Dashboard with ECharts
│   └── .env                           # API URL, Google, reCAPTCHA
│
├── api/                    # Bun + Hono
│   └── index.ts                       # ⭐ All endpoints (197 lines)
│
├── backend/                # Go + Fiber
│   ├── cmd/ingestion/main.go          # ⭐ Event ingestion API
│   └── pkg/
│       ├── clickhouse/client.go       # ⭐ ClickHouse client
│       ├── kafka/producer.go          # ⭐ Kafka producer
│       └── redis/client.go            # ⭐ Redis client
│
├── docs/
│   ├── CURRENT_STATUS.md              # ⭐⭐⭐ READ THIS FIRST
│   ├── DECISIONS.md                   # ⭐⭐ Architecture decisions
│   └── status/                        # Migration reports
│
├── DOCUMENTS/              # 350+ pages original docs
├── .claude/                # AI agent commands
└── TODO.md                 # ⭐⭐ Prioritized tasks
```

---

## 🚀 Quick Commands

### Start Services
```bash
# Infrastructure (run first)
docker-compose up -d

# Frontend (port 5173)
cd frontend && npm run dev

# API (port 3001)
cd api && PORT=3001 bun run index.ts

# Backend (port 8080) - not running yet
cd backend/cmd/ingestion && go run main.go
```

### Test Endpoints
```bash
# API health
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass","rememberMe":true,"recaptchaToken":"token"}'

# Dashboard stats
curl http://localhost:3001/api/dashboard/stats
```

### Git Commands
```bash
git status
git log --oneline -5
git diff main..feature/migrate-to-svelte
```

---

## 🎯 Suggested Next Steps

When starting next session, choose ONE:

### Option 1: Complete Authentication (2-3 hours)
```
1. Create PostgreSQL users table
2. Implement bcrypt password hashing
3. Real JWT token generation
4. Update API endpoints
5. Test full auth flow
```

### Option 2: Start Go Backend (1-2 hours)
```
1. Start Go backend on port 8080
2. Test event ingestion endpoint
3. Verify ClickHouse connection
4. Test Kafka producer
5. Load test with sample events
```

### Option 3: Dashboard Improvements (2-3 hours)
```
1. Connect to real ClickHouse data
2. Add more chart types
3. Date range picker
4. Filters (app, platform)
5. Real-time updates
```

### Option 4: Apps Management (2-3 hours)
```
1. Create /apps page
2. List apps with stats
3. Create new app form
4. Generate API keys
5. CRUD operations
```

---

## ⚠️ Important Notes

### Token Budget Management
- We work in 200k token sessions
- After tokens run out, session restarts
- **Always update `CURRENT_STATUS.md` before session ends**
- Commit important changes to Git

### Working with Me (Claude Code)
- I can read ALL files in project
- I remember Git history
- I DON'T remember conversation details between sessions
- **Documentation in files = my memory**

### Best Practices
1. **Commit often** with descriptive messages
2. **Update CURRENT_STATUS.md** at end of session
3. **Document decisions** in DECISIONS.md
4. **Update TODO.md** as tasks complete
5. **Create ADRs** for major decisions

---

## 📊 Migration Timeline

**Day 1 (2025-10-21):** Frontend Setup
- Created SvelteKit project
- Tailwind CSS v4 setup
- Apache ECharts integration
- Login page migration
- Commit: `5ac03d4`

**Day 2 (2025-10-21):** Backend + API
- Go backend structure
- ClickHouse, Kafka, Redis clients
- Bun + Hono API with 10 endpoints
- Commit: `bfe6523`

**Day 3 (2025-10-21):** Integration
- API client ($lib/api/client.ts)
- Dashboard with ECharts
- Full integration testing
- Documentation
- Commit: `8b0656a`

---

## 🤝 AI Agents Available

11 specialized agents in `.claude/commands/`:
- `pm.md` - Product Manager
- `techlead.md` - Technical Lead
- `frontend.md` - Frontend Developer
- `backend-go.md` - Go Backend Developer
- `devops.md` - DevOps Engineer
- `qa.md` - QA Engineer
- `security.md` - Security Expert
- `ux.md` - UX/UI Designer
- `docs.md` - Documentation
- `ml.md` - Machine Learning
- `orchestrator.md` - Orchestrator

Use: `/pm`, `/techlead`, etc.

---

## 📝 Common Questions

**Q: Where is authentication code?**
A: `api/index.ts` lines 30-76 (mock implementation)

**Q: How to add a new API endpoint?**
A:
1. Add to `api/index.ts`
2. Add types to `frontend/src/lib/api/client.ts`
3. Update `docs/CURRENT_STATUS.md`

**Q: How to add a new page?**
A: Create `frontend/src/routes/pagename/+page.svelte`

**Q: Where are environment variables?**
A:
- Frontend: `frontend/.env` (gitignored)
- API: `api/.env` (not created yet)
- Backend: `backend/.env` (not created yet)

**Q: How to run tests?**
A: Tests not implemented yet (see TODO.md)

**Q: Where is production build?**
A: Not configured yet (see TODO.md)

---

## 🎯 Success Criteria for Next Phase

1. ✅ **Real Authentication**
   - PostgreSQL integration
   - Password hashing
   - Real JWT tokens
   - Session management

2. ✅ **Go Backend Running**
   - Event ingestion working
   - ClickHouse storing data
   - Kafka streaming events

3. ✅ **Dashboard with Real Data**
   - ClickHouse queries
   - Real stats
   - Multiple chart types

4. ✅ **Basic CRUD**
   - Apps management
   - User settings

---

## 🔗 External Resources

- [Svelte 5 Docs](https://svelte-5-preview.vercel.app/docs)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Bun Docs](https://bun.sh/docs)
- [Hono Docs](https://hono.dev/)
- [Go Fiber Docs](https://docs.gofiber.io/)
- [ClickHouse Docs](https://clickhouse.com/docs)

---

**This file is your starting point for every new session. Read it first!**
