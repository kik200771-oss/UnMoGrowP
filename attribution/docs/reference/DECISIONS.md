# Architectural Decision Records (ADR)

**Project:** UnMoGrowP Attribution Platform
**Purpose:** Document all significant architectural and technical decisions

---

## ADR-001: Migration from Next.js + React to Svelte 5 + Go + Bun

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** User + Claude Code

### Context

The project initially had a Next.js + React implementation, but a deep analysis revealed:
- 350+ pages in `DOCUMENTS/` describe Svelte 5 + Go + Bun stack
- 11 AI agents in `.claude/commands/` configured for Svelte 5
- Original vision document specifies Svelte 5 as the frontend framework
- Stack mismatch between code and documentation

### Decision

**Chosen:** Variant A - Full migration to Svelte 5 + Go + Bun

**Stack:**
- **Frontend:** Svelte 5 (Runes API) + SvelteKit
- **API Layer:** Bun + Hono
- **Backend:** Go + Fiber v3
- **Databases:** PostgreSQL, ClickHouse, Kafka, Redis

### Rationale

1. **Performance:**
   - Svelte 5: 40 KB bundle vs React 140 KB (3.5x smaller)
   - Bun: 90k req/sec vs Node 30k req/sec (3x faster)
   - Go: 10M events/sec capability vs Node 10k/sec (1000x faster)

2. **Consistency:**
   - Aligns with 350+ pages of documentation
   - Matches AI agents configuration
   - Follows original vision

3. **Developer Experience:**
   - Svelte 5 Runes API simpler than React hooks
   - TypeScript throughout
   - Modern tooling (Vite, Bun)

4. **Future-proof:**
   - Edge-ready (Hono)
   - Microservices architecture
   - Horizontal scaling capability

### Consequences

**Positive:**
- ✅ Smaller bundle size
- ✅ Better performance
- ✅ Consistency with docs
- ✅ Modern tech stack

**Negative:**
- ⚠️ 3 days migration effort
- ⚠️ Learning curve for Svelte 5 (if team unfamiliar)

### Alternatives Considered

- **Variant B:** Keep Next.js, update docs → Rejected (docs too extensive)
- **Variant C:** Hybrid (Next.js + Go backend) → Rejected (inconsistent)

---

## ADR-002: Forward Proxy Pattern for API Architecture

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** Claude Code

### Context

Need to decide how frontend communicates with backend services.

### Decision

**Chosen:** Forward Proxy Pattern

```
Frontend (5173) → Bun API (3001) → Go Backend (8080) → Databases
```

### Rationale

1. **Separation of Concerns:**
   - Bun API handles auth, session, business logic
   - Go backend handles high-throughput event ingestion
   - Each service optimized for its use case

2. **Security:**
   - Frontend never talks directly to Go backend
   - API layer validates all requests
   - Centralized authentication

3. **Flexibility:**
   - Can add more backend services
   - Can switch backend implementation
   - API contract stable

### Consequences

**Positive:**
- ✅ Clear separation of concerns
- ✅ Better security
- ✅ Easier to maintain

**Negative:**
- ⚠️ Extra network hop (minimal latency)
- ⚠️ More complex deployment

### Alternatives Considered

- **Direct Frontend → Go Backend:** Rejected (mixing concerns)
- **API Gateway (Kong/Nginx):** Rejected (over-engineering for MVP)

---

## ADR-003: Token-Based Authentication with localStorage

**Date:** 2025-10-21
**Status:** ⚠️ Temporary (needs improvement)
**Deciders:** Claude Code

### Context

Need simple authentication for MVP testing.

### Decision

**Chosen:** JWT tokens in localStorage

```typescript
localStorage.setItem('auth_token', response.data.token);
```

### Rationale

1. **Simplicity:** Easy to implement for MVP
2. **Testing:** Can test flows quickly
3. **Stateless:** No server-side session storage

### Consequences

**Positive:**
- ✅ Simple implementation
- ✅ Works for testing

**Negative:**
- ⚠️ Vulnerable to XSS attacks
- ⚠️ No automatic refresh
- ⚠️ Manual logout required

### Future Improvements

**TODO:** Migrate to httpOnly cookies + refresh tokens
- More secure against XSS
- Automatic token refresh
- Better session management

### Alternatives Considered

- **httpOnly cookies:** Better but more complex (for later)
- **Session storage:** Similar security issues

---

## ADR-004: Svelte 5 Runes API for State Management

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** Claude Code

### Context

Svelte 5 introduces new Runes API ($state, $derived, $effect) replacing stores.

### Decision

**Chosen:** Use Runes API exclusively

```typescript
let email = $state('');
let isLoading = $state(false);
let errorMessage = $state<string | null>(null);
```

### Rationale

1. **Modern:** Latest Svelte 5 best practice
2. **Simpler:** Less boilerplate than stores
3. **Type-safe:** Better TypeScript support
4. **Performance:** Optimized by Svelte compiler

### Consequences

**Positive:**
- ✅ Cleaner code
- ✅ Better DX
- ✅ Less boilerplate

**Negative:**
- ⚠️ Requires Svelte 5 (not backward compatible)

---

## ADR-005: Tailwind CSS v4 with PostCSS Plugin

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** Claude Code

### Context

Tailwind CSS v4 introduces new PostCSS-based architecture.

### Decision

**Chosen:** Use Tailwind v4 with `@tailwindcss/postcss`

```css
@import 'tailwindcss';
```

### Rationale

1. **Latest version:** Future-proof
2. **Performance:** Faster builds
3. **Simplified config:** Less configuration needed

### Consequences

**Positive:**
- ✅ Modern approach
- ✅ Faster builds
- ✅ Cleaner setup

**Negative:**
- ⚠️ Different from v3 (if team familiar with v3)

---

## ADR-006: Apache ECharts for Data Visualization

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** Claude Code

### Context

Need charting library for Dashboard.

### Decision

**Chosen:** Apache ECharts

### Rationale

1. **Feature-rich:** Supports all chart types needed
2. **Performance:** Handles large datasets
3. **Open-source:** Apache 2.0 license
4. **Svelte-friendly:** Works well with Svelte

### Consequences

**Positive:**
- ✅ Powerful charting
- ✅ Good performance
- ✅ Free

**Negative:**
- ⚠️ Larger bundle size than simpler libraries

### Alternatives Considered

- **Chart.js:** Simpler but less features
- **D3.js:** More control but steeper learning curve
- **Plotly:** Good but heavier

---

## ADR-007: Go Fiber v3 RC for Backend

**Date:** 2025-10-21
**Status:** ✅ Implemented (RC version)
**Deciders:** Claude Code

### Context

Need high-performance Go web framework for 10M events/sec target.

### Decision

**Chosen:** Fiber v3 RC

### Rationale

1. **Performance:** Fastest Go framework
2. **Express-like API:** Familiar syntax
3. **Bleeding-edge:** v3 improvements

### Consequences

**Positive:**
- ✅ Maximum performance
- ✅ Modern features

**Negative:**
- ⚠️ RC version (not stable yet)
- ⚠️ May have bugs

**Mitigation:**
- Easy to update to stable when released
- Critical APIs already documented

### Alternatives Considered

- **Gin:** Popular but slower
- **Echo:** Good but fewer features
- **Chi:** Lightweight but bare-bones

---

## ADR-008: Microservices Architecture

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** User + Claude Code

### Context

Need scalable architecture for attribution platform.

### Decision

**Chosen:** Microservices with clear boundaries

**Services:**
1. Frontend (SvelteKit) - Port 5173
2. API Layer (Bun + Hono) - Port 3001
3. Event Ingestion (Go + Fiber) - Port 8080
4. PostgreSQL - Port 5432
5. ClickHouse - Port 9000/8123
6. Kafka - Port 9092
7. Redis - Port 6379

### Rationale

1. **Scalability:** Scale services independently
2. **Maintainability:** Clear service boundaries
3. **Technology flexibility:** Use best tool for each job
4. **Team scaling:** Teams can own services

### Consequences

**Positive:**
- ✅ Horizontal scaling
- ✅ Independent deployment
- ✅ Technology freedom

**Negative:**
- ⚠️ More complex deployment
- ⚠️ Distributed system challenges
- ⚠️ Need service discovery

---

## ADR-009: Docker Compose for Local Development

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** Claude Code

### Context

Need local development environment with multiple databases.

### Decision

**Chosen:** Docker Compose for infrastructure

### Rationale

1. **Consistency:** Same environment for all devs
2. **Easy setup:** One command to start all services
3. **Isolation:** No conflicts with system packages

### Consequences

**Positive:**
- ✅ Quick onboarding
- ✅ Consistent environment
- ✅ Easy cleanup

**Negative:**
- ⚠️ Requires Docker installed
- ⚠️ Uses system resources

---

## ADR-010: TypeScript Throughout

**Date:** 2025-10-21
**Status:** ✅ Implemented
**Deciders:** Claude Code

### Context

Need type safety across frontend and API.

### Decision

**Chosen:** TypeScript for all JS/TS code

### Rationale

1. **Type Safety:** Catch errors at compile time
2. **Better DX:** IntelliSense, refactoring
3. **Documentation:** Types as documentation
4. **Industry standard:** Expected in 2025

### Consequences

**Positive:**
- ✅ Fewer runtime errors
- ✅ Better IDE support
- ✅ Self-documenting code

**Negative:**
- ⚠️ Slightly longer build times
- ⚠️ Learning curve for pure JS devs

---

## Template for Future ADRs

```markdown
## ADR-XXX: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** 🟡 Proposed / ✅ Implemented / ❌ Rejected / ⚠️ Deprecated
**Deciders:** [Names]

### Context
[Describe the problem and context]

### Decision
[What was decided]

### Rationale
[Why this decision was made]

### Consequences
**Positive:**
- [Good outcomes]

**Negative:**
- [Challenges]

### Alternatives Considered
- [Other options and why rejected]
```

---

**Last Updated:** 2025-10-21
