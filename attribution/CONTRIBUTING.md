# Contributing to UnMoGrowP Attribution Platform

Thank you for your interest in contributing! This document provides guidelines and workflows for contributing to the project.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing](#testing)
5. [Documentation](#documentation)
6. [Git Conventions](#git-conventions)
7. [AI Agents](#ai-agents)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (for frontend)
- **Bun** 1.3+ (for API layer)
- **Go** 1.25+ (for backend)
- **Docker** & Docker Compose (for infrastructure)
- **Make** (optional, for shortcuts)

### Quick Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd attribution

# 2. Copy environment files
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
cp backend/.env.example backend/.env

# 3. Install dependencies
make install
# or manually:
cd frontend && npm install
cd ../api && bun install
cd ../backend && go mod download

# 4. Start infrastructure
make start-infra
# or:
docker-compose up -d

# 5. Start services
make start
# or manually in separate terminals:
cd frontend && npm run dev
cd api && PORT=3001 bun run index.ts
cd backend/cmd/ingestion && go run main.go
```

---

## 🔄 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/migrate-to-svelte` - Current migration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Workflow Steps

1. **Create branch** from `main` or `feature/migrate-to-svelte`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** with frequent commits
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Update documentation**
   - Update `docs/CURRENT_STATUS.md` if status changed
   - Update `TODO.md` if tasks changed
   - Add ADR to `docs/DECISIONS.md` for architectural changes

4. **Test your changes**
   ```bash
   make test-api  # Test API
   make test      # Run all tests (when implemented)
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

---

## 📐 Code Standards

### Frontend (Svelte 5)

```svelte
<script lang="ts">
  // Use Runes API
  let count = $state(0);
  let doubled = $derived(count * 2);

  function increment() {
    count++;
  }
</script>

<button onclick={increment}>
  Count: {count} (Doubled: {doubled})
</button>

<style>
  button {
    /* Use Tailwind classes instead of custom CSS when possible */
  }
</style>
```

**Guidelines:**
- Use TypeScript for all `.ts` files
- Use Svelte 5 Runes API ($state, $derived, $effect)
- Prefer Tailwind CSS over custom styles
- Component files: PascalCase (e.g., `Button.svelte`)
- Route files: kebab-case (e.g., `+page.svelte`)

### API Layer (Bun + Hono)

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Type your endpoints
interface LoginRequest {
  email: string;
  password: string;
}

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json() as LoginRequest;
  // ... implementation
});
```

**Guidelines:**
- Use TypeScript strict mode
- Type all requests/responses
- Use async/await over promises
- Handle errors gracefully

### Backend (Go)

```go
package main

// Use meaningful variable names
func HandleEvent(c *fiber.Ctx) error {
    var event EventPayload
    if err := c.BodyParser(&event); err != nil {
        return fiber.NewError(fiber.StatusBadRequest, err.Error())
    }

    // ... implementation
    return c.JSON(fiber.Map{"success": true})
}
```

**Guidelines:**
- Follow [Effective Go](https://golang.org/doc/effective_go)
- Use `gofmt` for formatting
- Add godoc comments for exported functions
- Handle errors explicitly

---

## 🧪 Testing

### API Testing

```bash
# Test all API endpoints
make test-api

# Manual testing
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/auth/login -d '{"email":"test@test.com","password":"pass"}'
```

### Frontend Testing (TODO)

```bash
cd frontend
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

### Backend Testing (TODO)

```bash
cd backend
go test ./...
```

---

## 📝 Documentation

### When to Update Documentation

**Always update:**
- `docs/CURRENT_STATUS.md` - When project state changes
- `TODO.md` - When adding/completing tasks
- `CHANGELOG.md` - When releasing new version

**Sometimes update:**
- `docs/DECISIONS.md` - When making architectural decisions
- `.claude/project-context.md` - When critical context changes
- Code comments - When adding complex logic

### Documentation Standards

- Use Markdown for all docs
- Keep line length < 100 characters
- Use emojis sparingly (only in headings)
- Include code examples
- Link to related documents

---

## 📌 Git Conventions

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**

```bash
feat(auth): add PostgreSQL authentication

- Implement bcrypt password hashing
- Generate real JWT tokens
- Update API endpoints

Closes #123
```

```bash
fix(dashboard): correct stats calculation

The revenue calculation was using wrong formula.
Now uses correct attribution model.
```

### Commit Frequency

- **Commit often**: Every logical change
- **Atomic commits**: One logical change per commit
- **Descriptive messages**: Explain WHY, not just WHAT

---

## 🤖 AI Agents

We have 11 specialized AI agents in `.claude/commands/`:

```bash
/pm          - Product Manager
/techlead    - Technical Lead
/frontend    - Frontend Developer (Svelte)
/backend-go  - Go Backend Developer
/devops      - DevOps Engineer
/qa          - QA Engineer
/security    - Security Expert
/ux          - UX/UI Designer
/docs        - Documentation Writer
/ml          - Machine Learning Engineer
/orchestrator - Project Orchestrator
```

**Usage:**
```bash
# Get UX feedback
/ux review the new login page design

# Get security audit
/security review authentication implementation

# Get DevOps help
/devops help me set up CI/CD pipeline
```

---

## 🐛 Reporting Issues

### Bug Reports

**Title:** Brief description
**Labels:** `bug`, priority label

**Template:**
```markdown
## Description
What happened?

## Expected Behavior
What should have happened?

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Environment
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 0.3.0]

## Screenshots
If applicable

## Additional Context
Any other information
```

### Feature Requests

**Title:** Feature name
**Labels:** `enhancement`

**Template:**
```markdown
## Problem
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches?

## Additional Context
Any other information
```

---

## ✅ Pull Request Checklist

Before submitting PR:

- [ ] Code follows style guidelines
- [ ] Tests added/updated (when applicable)
- [ ] Documentation updated
- [ ] `docs/CURRENT_STATUS.md` updated
- [ ] `TODO.md` updated
- [ ] `CHANGELOG.md` updated
- [ ] No console.log statements
- [ ] All tests passing
- [ ] Git history is clean (squash if needed)

---

## 📞 Questions?

- Check `docs/CURRENT_STATUS.md` for project state
- Check `.claude/project-context.md` for context
- Check `TODO.md` for planned tasks
- Use `/pm` or `/techlead` AI agents for guidance

---

## 🎯 Good First Issues

Looking for where to start? Check issues labeled:
- `good first issue` - Easy tasks for beginners
- `help wanted` - Tasks that need contributors
- `documentation` - Documentation improvements

---

**Last Updated:** 2025-10-21

Thank you for contributing! 🎉
