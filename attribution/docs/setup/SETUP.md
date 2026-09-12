# Development Environment Setup Guide
## UnMoGrowP (Unified Mobile Growth Platform)

Complete guide to set up your local development environment for the UnMoGrowP project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Verify Installation](#verify-installation)
5. [Docker Services](#docker-services)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Operating System**: Windows 10/11 (64-bit) with WSL2 enabled
- **RAM**: Minimum 16 GB (recommended 32 GB)
- **Disk Space**: 50 GB free space
- **Internet Connection**: Required for downloading packages

---

## Quick Start

### 1. Install VS Code Extensions

```powershell
# Run the extensions installation script
.\install-vscode-extensions.ps1
```

**Installed Extensions (31 total):**
- Frontend: React snippets, ESLint, Prettier, Tailwind CSS
- Backend: Go, Go Test Explorer
- Database: SQLTools, Redis Client
- DevOps: Docker, Kubernetes, YAML, Terraform
- Git: GitLens, Git Graph
- AI/ML: Jupyter, Python, Pylance
- Productivity: Path Intellisense, Auto Rename Tag, Error Lens, Todo Tree
- Code Quality: SonarLint, Better Comments, Code Spell Checker
- Markdown: Markdown All in One, Preview Enhanced, Mermaid
- API Testing: REST Client, Thunder Client
- Theme: Material Icons, One Dark Pro

### 2. Install Development Services

```powershell
# Run the services installation script (requires Administrator privileges)
.\install-services.ps1
```

**Installed Services:**
- Git (version control)
- Node.js LTS v20.x (frontend)
- Go v1.21+ (backend)
- Python v3.11+ (ML/data science)
- Docker Desktop (containers)
- Bun (API runtime)
- Rust (optional - for Attribution Engine)

### 3. Start Docker Services

```powershell
# Start all services in background
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Detailed Setup

### Step 1: Install Chocolatey Package Manager

Chocolatey is a package manager for Windows that simplifies software installation.

```powershell
# Run in Administrator PowerShell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Verify installation:
```powershell
choco --version
```

### Step 2: Install Git

```powershell
choco install git -y
git --version
```

### Step 3: Install Node.js

```powershell
choco install nodejs-lts -y
node --version
npm --version
```

### Step 4: Install Go

```powershell
choco install golang -y
go version
```

### Step 5: Install Python

```powershell
choco install python -y
python --version
pip --version
```

### Step 6: Install Docker Desktop

```powershell
choco install docker-desktop -y
```

**IMPORTANT:**
1. Restart your computer after installation
2. Start Docker Desktop manually
3. Enable WSL2 integration in Docker Desktop settings
4. Wait for Docker to fully start (check system tray icon)

Verify Docker:
```powershell
docker --version
docker-compose --version
```

### Step 7: Install Bun

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
```

### Step 8: Install Rust (Optional)

Only needed if working on Attribution Engine.

```powershell
choco install rust -y
rustc --version
cargo --version
```

---

## Verify Installation

Run this script to verify all installations:

```powershell
# Check all installed tools
Write-Host "Checking installed tools..." -ForegroundColor Green
Write-Host ""

$tools = @(
    @{Name="Git"; Command="git --version"},
    @{Name="Node.js"; Command="node --version"},
    @{Name="npm"; Command="npm --version"},
    @{Name="Go"; Command="go version"},
    @{Name="Python"; Command="python --version"},
    @{Name="pip"; Command="pip --version"},
    @{Name="Docker"; Command="docker --version"},
    @{Name="Docker Compose"; Command="docker-compose --version"},
    @{Name="Bun"; Command="bun --version"}
)

foreach ($tool in $tools) {
    try {
        $version = Invoke-Expression $tool.Command 2>&1
        Write-Host "[OK] $($tool.Name): $version" -ForegroundColor Green
    } catch {
        Write-Host "[MISSING] $($tool.Name)" -ForegroundColor Red
    }
}
```

---

## Docker Services

### Available Services

The `docker-compose.yml` file provides:

1. **ClickHouse** (OLAP Database)
   - HTTP Interface: `http://localhost:8123`
   - Native TCP: `localhost:9000`
   - User: `unmogrowp`
   - Password: `dev_password_123`

2. **PostgreSQL** (OLTP Database)
   - Host: `localhost:5432`
   - Database: `unmogrowp`
   - User: `unmogrowp`
   - Password: `dev_password_123`

3. **Redis** (Cache)
   - Host: `localhost:6379`
   - Password: `dev_password_123`

4. **Kafka** (Event Streaming)
   - Bootstrap Server: `localhost:9092`
   - Zookeeper: `localhost:2181`

5. **Kafka UI** (Web Interface)
   - URL: `http://localhost:8080`

### Docker Commands

```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f clickhouse

# Restart a service
docker-compose restart postgres

# Check service status
docker-compose ps

# Execute command in container
docker-compose exec postgres psql -U unmogrowp
```

### Connect to Services

**ClickHouse:**
```bash
# Using HTTP
curl http://localhost:8123/?query=SELECT%201

# Using clickhouse-client
docker-compose exec clickhouse clickhouse-client -u unmogrowp --password dev_password_123
```

**PostgreSQL:**
```bash
# Using psql
docker-compose exec postgres psql -U unmogrowp

# Using connection string
postgresql://unmogrowp:dev_password_123@localhost:5432/unmogrowp
```

**Redis:**
```bash
# Using redis-cli
docker-compose exec redis redis-cli -a dev_password_123

# Test connection
redis-cli -h localhost -p 6379 -a dev_password_123 ping
```

**Kafka:**
```bash
# Create topic
docker-compose exec kafka kafka-topics --create --topic events --bootstrap-server localhost:9092

# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Produce message
docker-compose exec kafka kafka-console-producer --topic events --bootstrap-server localhost:9092

# Consume messages
docker-compose exec kafka kafka-console-consumer --topic events --from-beginning --bootstrap-server localhost:9092
```

---

## Project Structure

```
C:\КОДИНГ\attribution\
│
├── .claude/                      # AI Agents configuration
│   └── commands/
│       ├── orchestrator.md       # Team Orchestrator
│       ├── pm.md                 # Product Manager
│       ├── ux.md                 # UX/UI Designer
│       ├── techlead.md           # Tech Lead
│       ├── backend-go.md         # Backend Developer (Go)
│       ├── frontend.md           # Frontend Developer (Svelte 5)
│       ├── ml.md                 # ML Engineer
│       ├── qa.md                 # QA Engineer
│       ├── devops.md             # DevOps Engineer
│       ├── security.md           # Security Engineer
│       ├── docs.md               # Technical Writer
│       └── README.md             # Agents documentation
│
├── DOCUMENTS/                    # Project documentation (350+ pages)
│   ├── 00_Executive_Overview.md
│   ├── 01_Technical_Architecture.md
│   ├── 02_API_Documentation.md
│   └── ...
│
├── frontend/                     # Svelte 5 Dashboard
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/                      # Go Backend Services
│   ├── cmd/
│   ├── internal/
│   ├── go.mod
│   └── ...
│
├── ml/                          # Python ML Services
│   ├── models/
│   ├── pipelines/
│   ├── requirements.txt
│   └── ...
│
├── docker-compose.yml           # Local development services
├── install-vscode-extensions.ps1 # VS Code extensions installer
├── install-services.ps1         # Development services installer
├── SETUP.md                     # This file
├── README.md                    # Project README
└── package.json                 # Root package.json
```

---

## Troubleshooting

### Docker Desktop Not Starting

**Issue**: Docker Desktop fails to start or shows "Docker Desktop starting..." indefinitely.

**Solutions:**
1. Enable WSL2:
   ```powershell
   wsl --install
   wsl --set-default-version 2
   ```

2. Enable Virtualization in BIOS (Intel VT-x or AMD-V)

3. Enable Hyper-V:
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   ```

4. Restart Docker Desktop:
   - Right-click Docker Desktop icon → Quit
   - Start Docker Desktop again

### Port Already in Use

**Issue**: Docker services fail to start with "port already in use" error.

**Solution**: Check what's using the port:
```powershell
# Check port 5432 (PostgreSQL)
netstat -ano | findstr :5432

# Kill process using the port
taskkill /PID <PID> /F
```

### Chocolatey Installation Failed

**Issue**: Chocolatey installation script fails.

**Solution**: Install manually:
1. Download installer from https://chocolatey.org/install
2. Run as Administrator
3. Verify with `choco --version`

### Node.js/npm Not Found After Installation

**Issue**: `node` or `npm` commands not recognized.

**Solution**: Refresh environment variables:
```powershell
# Restart PowerShell or run:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### VS Code Extensions Not Loading

**Issue**: Installed extensions don't appear in VS Code.

**Solution**:
1. Restart VS Code completely
2. Check extensions are enabled: `Ctrl+Shift+X` → Enable all
3. Reinstall extension: Right-click → Uninstall → Install again

### Docker Compose Out of Memory

**Issue**: Services crash with OOM (Out of Memory) errors.

**Solution**: Increase Docker memory limit:
1. Open Docker Desktop
2. Settings → Resources → Memory
3. Increase to at least 8 GB (recommended 12 GB)
4. Apply & Restart

---

## Additional Resources

### Documentation
- **Project Docs**: `C:\КОДИНГ\attribution\DOCUMENTS\`
- **AI Agents Guide**: `C:\КОДИНГ\attribution\.claude\commands\README.md`

### Tech Stack Documentation
- **Next.js**: https://nextjs.org/docs
- **Svelte 5**: https://svelte-5-preview.vercel.app/docs
- **Go**: https://go.dev/doc/
- **ClickHouse**: https://clickhouse.com/docs
- **Kafka**: https://kafka.apache.org/documentation/
- **Docker**: https://docs.docker.com/

### Community
- **GitHub Issues**: (your repo URL)
- **Slack/Discord**: (your community link)

---

## Next Steps

After completing setup:

1. **Clone Repository** (if not already done):
   ```powershell
   git clone https://github.com/kik200771-oss/UnMoGrowP.git
   cd attribution
   ```

2. **Install Dependencies**:
   ```powershell
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   go mod download

   # ML
   cd ../ml
   pip install -r requirements.txt
   ```

3. **Start Development Servers**:
   ```powershell
   # Terminal 1: Docker services
   docker-compose up -d

   # Terminal 2: Frontend
   cd frontend
   npm run dev

   # Terminal 3: Backend
   cd backend
   go run cmd/api/main.go

   # Terminal 4: ML service (if needed)
   cd ml
   python app.py
   ```

4. **Use AI Agents**: Read `.claude/commands/README.md` to learn about available AI agents for development assistance.

---

**Setup complete! Happy coding!** 🚀
