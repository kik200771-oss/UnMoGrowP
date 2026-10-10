# TODO - UnMoGrowP Attribution Platform

**Last Updated:** 2025-10-21
**Current Status:** Migration Complete (100%)

---

## 🔴 High Priority (Critical for Production)

### Authentication & Security
- [ ] **PostgreSQL authentication integration**
  - [ ] Create users table schema
  - [ ] Implement user registration with password hashing (bcrypt)
  - [ ] Replace mock JWT tokens with real JWT generation
  - [ ] Add JWT secret to environment variables
  - [ ] Implement token refresh mechanism

- [ ] **Auth.js + Google OAuth setup**
  - [ ] Install @auth/sveltekit
  - [ ] Configure Google OAuth provider
  - [ ] Get Google Client ID and Secret
  - [ ] Set up callback URLs
  - [ ] Implement session management
  - [ ] Add CSRF protection

- [ ] **reCAPTCHA integration**
  - [ ] Get Google reCAPTCHA keys (v2 or v3)
  - [ ] Replace mock token in frontend
  - [ ] Add server-side verification
  - [ ] Handle reCAPTCHA errors

### Backend
- [ ] **Start and test Go backend**
  - [ ] Run backend on port 8080
  - [ ] Test /v1/events endpoint
  - [ ] Test /v1/events/batch endpoint
  - [ ] Verify connection to ClickHouse
  - [ ] Verify connection to Kafka
  - [ ] Verify connection to Redis
  - [ ] Load testing (target: 10M events/sec)

- [ ] **ClickHouse schema setup**
  - [ ] Create events table
  - [ ] Create materialized views for analytics
  - [ ] Set up TTL policies
  - [ ] Create indexes

- [ ] **Kafka topics configuration**
  - [ ] Create topics for events
  - [ ] Configure retention policies
  - [ ] Set up consumer groups

---

## 🟡 Medium Priority (Important for MVP)

### Dashboard & UI
- [ ] **Real data integration**
  - [ ] Connect Dashboard to ClickHouse via API
  - [ ] Implement real-time stats queries
  - [ ] Add date range picker
  - [ ] Add filters (app, platform, etc.)
  - [ ] More chart types (pie, bar, funnel)

- [ ] **Apps Management UI**
  - [ ] Create /apps page
  - [ ] List all apps with stats
  - [ ] Create new app form
  - [ ] Generate API keys for apps
  - [ ] Edit/delete apps

- [ ] **Analytics Reports**
  - [ ] Create /analytics page
  - [ ] Attribution model selection (First Click, Last Click, Linear, etc.)
  - [ ] Custom date ranges
  - [ ] Export to CSV/PDF
  - [ ] Scheduled reports

- [ ] **User Settings**
  - [ ] Create /settings page
  - [ ] Update user profile
  - [ ] Change password
  - [ ] API key management
  - [ ] Notification preferences

### API Improvements
- [ ] **API authentication middleware**
  - [ ] Verify JWT tokens on protected routes
  - [ ] Implement rate limiting
  - [ ] Add request logging

- [ ] **Error handling**
  - [ ] Standardized error responses
  - [ ] Error codes
  - [ ] Detailed error messages for development

- [ ] **API documentation**
  - [ ] OpenAPI/Swagger spec
  - [ ] API documentation page
  - [ ] Example requests

---

## 🟢 Low Priority (Nice to Have)

### Testing
- [ ] **Frontend testing**
  - [ ] Unit tests for components (Vitest)
  - [ ] Integration tests for API client
  - [ ] E2E tests (Playwright)

- [ ] **Backend testing**
  - [ ] Go unit tests
  - [ ] Integration tests with test DB
  - [ ] Load testing with k6

- [ ] **API testing**
  - [ ] Unit tests for endpoints
  - [ ] Integration tests

### DevOps & Infrastructure
- [ ] **CI/CD Pipeline**
  - [ ] GitHub Actions setup
  - [ ] Automated testing on PR
  - [ ] Automated deployment

- [ ] **Docker improvements**
  - [ ] Production Dockerfile for frontend
  - [ ] Production Dockerfile for API
  - [ ] Production Dockerfile for backend
  - [ ] Docker Compose for production
  - [ ] Multi-stage builds

- [ ] **Monitoring & Logging**
  - [ ] Sentry integration for error tracking
  - [ ] Structured logging (Winston/Pino)
  - [ ] Prometheus metrics
  - [ ] Grafana dashboards
  - [ ] Health check endpoints

### Performance
- [ ] **Frontend optimization**
  - [ ] Code splitting
  - [ ] Lazy loading for routes
  - [ ] Image optimization
  - [ ] Service Worker for caching

- [ ] **Backend optimization**
  - [ ] Connection pooling tuning
  - [ ] Redis caching strategy
  - [ ] ClickHouse query optimization
  - [ ] Kafka batch optimization

### Documentation
- [ ] **User documentation**
  - [ ] Getting started guide
  - [ ] API integration guide
  - [ ] Troubleshooting guide

- [ ] **Developer documentation**
  - [ ] Setup guide for new developers
  - [ ] Architecture overview
  - [ ] Code style guide
  - [ ] Contribution guidelines

---

## ✅ Recently Completed

### Day 1 (2025-10-21)
- ✅ Created SvelteKit project with TypeScript
- ✅ Configured Tailwind CSS v4
- ✅ Installed Apache ECharts
- ✅ Migrated Login page from React to Svelte 5
- ✅ Git commit: Day 1

### Day 2 (2025-10-21)
- ✅ Created Go backend structure (Fiber v3)
- ✅ Implemented ClickHouse client
- ✅ Implemented Kafka producer
- ✅ Implemented Redis client
- ✅ Created Bun + Hono API layer with 10 endpoints
- ✅ Git commit: Day 2

### Day 3 (2025-10-21)
- ✅ Created API client ($lib/api/client.ts)
- ✅ Connected Login page to API
- ✅ Created Dashboard with ECharts
- ✅ Tested full integration flow
- ✅ Git commit: Day 3
- ✅ Created comprehensive documentation

---

## 🎯 Next Session Recommendations

**Start with:**
1. PostgreSQL authentication setup (1-2 hours)
2. Start Go backend and test (30 min)
3. Real ClickHouse data integration (1 hour)

**Or:**
1. Create Apps Management UI (2-3 hours)
2. Add more Dashboard components (1-2 hours)

**Or:**
1. Set up Auth.js + Google OAuth (2-3 hours)
2. Implement real JWT tokens (1 hour)

---

## 📝 Notes

- All infrastructure (PostgreSQL, ClickHouse, Kafka, Redis) is running in Docker
- Frontend and API are running and fully tested
- Go backend code is ready but not started yet
- All mock data in API endpoints should be replaced with real DB queries

---

## 🔗 Related Files

- [CURRENT_STATUS.md](./docs/CURRENT_STATUS.md) - Current project state
- [DECISIONS.md](./docs/DECISIONS.md) - Architectural decisions
- [Migration Reports](./docs/status/) - Detailed migration documentation
