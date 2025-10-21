# Documentation Index

Welcome to the UnMoGrowP Attribution Platform documentation! This index helps you quickly find the information you need.

---

## 📖 Quick Navigation

### 🚀 Getting Started

**Start here if you're new:**

1. **[../README.md](../README.md)** - Project overview, tech stack, quick start
2. **[START.md](START.md)** - Detailed startup guide for new sessions
3. **[TODO.md](TODO.md)** - Current tasks and priorities
4. **[CURRENT_STATUS.md](CURRENT_STATUS.md)** ⭐ **MOST IMPORTANT** - Current state of everything

---

## 📚 Documentation Sections

### 📁 Reference (Technical Documentation)

Located in `docs/reference/`

- **[DECISIONS.md](reference/DECISIONS.md)** - Architectural Decision Records (10 ADRs)
  - Why Svelte 5 over React
  - Forward Proxy Pattern
  - Token-based authentication
  - And 7 more...

- **[WORKFLOW_IMPROVEMENTS.md](reference/WORKFLOW_IMPROVEMENTS.md)** - Workflow enhancements
  - Makefile commands
  - .gitignore improvements
  - Environment variable templates
  - Future recommendations

- **[PROJECT_STRUCTURE_IMPROVEMENTS.md](reference/PROJECT_STRUCTURE_IMPROVEMENTS.md)** - File organization
  - Directory structure
  - Reorganization strategy
  - Benefits analysis

### 📅 Sessions (Migration Reports)

Located in `docs/sessions/`

- **[SESSION_SUMMARY.md](sessions/SESSION_SUMMARY.md)** - Session continuity summary
- **[MIGRATION_DAY1_2025-10-21.md](sessions/MIGRATION_DAY1_2025-10-21.md)** - Day 1: Frontend setup
- **[MIGRATION_DAY2_2025-10-21.md](sessions/MIGRATION_DAY2_2025-10-21.md)** - Day 2: Backend + API
- **[MIGRATION_DAY3_2025-10-21.md](sessions/MIGRATION_DAY3_2025-10-21.md)** - Day 3: Integration

### 👥 Team Documentation

Located in `docs/team/` (prepared for future use)

- Team guidelines
- Onboarding docs
- Meeting notes
- Design decisions

---

## 🗂️ Root Documentation Files

### Development

- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - How to contribute
  - Development workflow
  - Code standards (Svelte 5, TypeScript, Go)
  - Git conventions
  - Testing guidelines

- **[../CHANGELOG.md](../CHANGELOG.md)** - Version history
  - Versions 0.0.1 → 0.3.0
  - Features, changes, fixes

- **[../Makefile](../Makefile)** - Quick commands
  - `make start` - Start all services
  - `make stop` - Stop all services
  - `make test-api` - Test API endpoints
  - `make help` - See all commands

### Configuration

- **[../.gitignore](../.gitignore)** - Git ignore rules
- **[../docker-compose.yml](../docker-compose.yml)** - Infrastructure setup
- **[../.vscode/settings.json](../.vscode/settings.json)** - VS Code workspace settings
- **[../.vscode/extensions.json](../.vscode/extensions.json)** - Recommended extensions

---

## 🎯 Documentation by Task

### I want to...

#### **Start working on the project**
1. Read [CURRENT_STATUS.md](CURRENT_STATUS.md)
2. Read [TODO.md](TODO.md)
3. Run `make start` or follow [START.md](START.md)

#### **Understand why we made certain decisions**
- Read [reference/DECISIONS.md](reference/DECISIONS.md)

#### **Contribute to the project**
- Read [../CONTRIBUTING.md](../CONTRIBUTING.md)

#### **See what was done in the migration**
- Read [sessions/MIGRATION_DAY1_2025-10-21.md](sessions/MIGRATION_DAY1_2025-10-21.md)
- Read [sessions/MIGRATION_DAY2_2025-10-21.md](sessions/MIGRATION_DAY2_2025-10-21.md)
- Read [sessions/MIGRATION_DAY3_2025-10-21.md](sessions/MIGRATION_DAY3_2025-10-21.md)

#### **Know what to work on next**
- Read [TODO.md](TODO.md) (prioritized task list)

#### **Set up my development environment**
1. Read [../CONTRIBUTING.md](../CONTRIBUTING.md) - Getting Started section
2. Copy `.env.example` files
3. Run `make install`
4. Run `make start`

#### **Understand the current project state**
- Read [CURRENT_STATUS.md](CURRENT_STATUS.md) ⭐

#### **Learn about workflow improvements**
- Read [reference/WORKFLOW_IMPROVEMENTS.md](reference/WORKFLOW_IMPROVEMENTS.md)

---

## 🤖 AI Context Files

Located in `.claude/`

- **[../.claude/project-context.md](../.claude/project-context.md)** - Main context for AI sessions
  - Auto-read protocol
  - Critical context points
  - Quick commands
  - Common questions

- **[../.claude/commands/](../.claude/commands/)** - AI agent commands
  - `/pm` - Product Manager
  - `/techlead` - Technical Lead
  - `/frontend` - Frontend Developer
  - `/backend-go` - Go Backend Developer
  - And 7 more...

---

## 📊 Project Structure Overview

```
C:\КОДИНГ\attribution/
├── frontend/               # Svelte 5 + SvelteKit
│   ├── src/lib/api/       # API client
│   └── src/routes/        # Pages (login, dashboard)
│
├── api/                   # Bun + Hono API
│   └── index.ts           # All endpoints
│
├── backend/               # Go + Fiber backend
│   ├── cmd/ingestion/     # Event ingestion service
│   └── pkg/               # Packages (ClickHouse, Kafka, Redis)
│
├── docs/                  # 📚 YOU ARE HERE
│   ├── README.md          # This file
│   ├── CURRENT_STATUS.md  # ⭐ Current state
│   ├── START.md           # Startup guide
│   ├── TODO.md            # Task list
│   ├── reference/         # Technical docs
│   ├── sessions/          # Migration reports
│   └── team/              # Team docs (future)
│
├── .claude/               # AI context & commands
├── .vscode/               # VS Code settings
├── DOCUMENTS/             # Original 350+ page docs
├── README.md              # Main readme
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md        # Contribution guide
├── Makefile               # Quick commands
└── docker-compose.yml     # Infrastructure
```

---

## 🔍 Search Tips

### Finding Files

```bash
# Find all Svelte components
find frontend/src -name "*.svelte"

# Find all API endpoints
grep -r "app.post\|app.get" api/

# Find all Go files
find backend -name "*.go"
```

### Searching Documentation

```bash
# Search in all docs
grep -r "your search term" docs/

# Search in reference docs only
grep -r "your search term" docs/reference/

# Search in session reports
grep -r "your search term" docs/sessions/
```

---

## 📝 Update Guidelines

**When updating documentation:**

1. **Always update** after major changes:
   - `CURRENT_STATUS.md` - Project state changes
   - `TODO.md` - Task changes
   - `CHANGELOG.md` - Version releases

2. **Sometimes update**:
   - `reference/DECISIONS.md` - Architecture decisions
   - `.claude/project-context.md` - Critical context changes
   - This file (`docs/README.md`) - New docs added

3. **Keep documentation DRY** (Don't Repeat Yourself):
   - Link to other docs instead of duplicating
   - Use relative links
   - Keep this index up to date

---

## 🎯 Documentation Standards

- **Format**: Markdown (.md)
- **Line length**: < 100 characters
- **Emojis**: Only in headings
- **Code blocks**: Always specify language
- **Links**: Use relative paths
- **TOC**: Add for docs > 200 lines

---

## 📞 Questions?

- Check [CURRENT_STATUS.md](CURRENT_STATUS.md) for project state
- Check [../.claude/project-context.md](../.claude/project-context.md) for context
- Check [TODO.md](TODO.md) for planned tasks
- Use `/pm` or `/techlead` AI agents for guidance

---

**Last Updated:** 2025-10-21

**Navigation:** [↑ Back to Root README](../README.md) | [→ Current Status](CURRENT_STATUS.md) | [→ TODO](TODO.md)
