# Services Installation Script for UnMoGrowP
# Installs: Node.js, Go, Python, Bun, Docker Desktop, Git

Write-Host "Installing Development Services for UnMoGrowP..." -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator. Some installations may require elevated privileges." -ForegroundColor Yellow
    Write-Host ""
}

# Check if Chocolatey is installed
function Test-Chocolatey {
    try {
        choco --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Install Chocolatey if not present
if (-not (Test-Chocolatey)) {
    Write-Host "Chocolatey not found. Installing Chocolatey package manager..." -ForegroundColor Yellow
    Write-Host ""

    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072

    try {
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "Chocolatey installed successfully!" -ForegroundColor Green
        Write-Host ""

        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Write-Host "Failed to install Chocolatey. Please install manually from https://chocolatey.org/install" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Chocolatey is already installed" -ForegroundColor Green
    Write-Host ""
}

# Function to check if software is installed
function Test-Software {
    param([string]$Command)
    try {
        & $Command --version 2>&1 | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to install software using Chocolatey
function Install-Software {
    param(
        [string]$PackageName,
        [string]$DisplayName,
        [string]$TestCommand
    )

    Write-Host "===============================================" -ForegroundColor Yellow
    Write-Host "Checking: $DisplayName" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Yellow

    if (Test-Software $TestCommand) {
        Write-Host "$DisplayName is already installed" -ForegroundColor Green
        & $TestCommand --version
    } else {
        Write-Host "Installing $DisplayName..." -ForegroundColor Yellow
        choco install $PackageName -y

        if ($LASTEXITCODE -eq 0) {
            Write-Host "$DisplayName installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Failed to install $DisplayName" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Install Git
Install-Software "git" "Git" "git"

# Install Node.js LTS
Install-Software "nodejs-lts" "Node.js LTS" "node"

# Install Go
Install-Software "golang" "Go" "go"

# Install Python
Install-Software "python" "Python" "python"

# Install Docker Desktop
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Checking: Docker Desktop" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow

if (Test-Software "docker") {
    Write-Host "Docker Desktop is already installed" -ForegroundColor Green
    docker --version
} else {
    Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
    Write-Host "Note: Docker Desktop requires manual setup after installation" -ForegroundColor Yellow
    choco install docker-desktop -y

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker Desktop installed successfully!" -ForegroundColor Green
        Write-Host "IMPORTANT: Please restart your computer and start Docker Desktop manually" -ForegroundColor Yellow
    } else {
        Write-Host "Failed to install Docker Desktop" -ForegroundColor Red
    }
}
Write-Host ""

# Install Bun (JavaScript runtime)
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Checking: Bun" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow

if (Test-Software "bun") {
    Write-Host "Bun is already installed" -ForegroundColor Green
    bun --version
} else {
    Write-Host "Installing Bun..." -ForegroundColor Yellow
    try {
        powershell -c "irm bun.sh/install.ps1 | iex"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Bun installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Failed to install Bun" -ForegroundColor Red
        }
    } catch {
        Write-Host "Failed to install Bun: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Optional: Install Rust (for Attribution Engine development)
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Optional: Rust" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Rust is only needed if you plan to work on the Attribution Engine" -ForegroundColor Gray

$installRust = Read-Host "Do you want to install Rust? (y/n)"

if ($installRust -eq "y" -or $installRust -eq "Y") {
    if (Test-Software "rustc") {
        Write-Host "Rust is already installed" -ForegroundColor Green
        rustc --version
    } else {
        Write-Host "Installing Rust..." -ForegroundColor Yellow
        choco install rust -y

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Rust installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Failed to install Rust" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Skipping Rust installation" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installed Services:" -ForegroundColor Cyan
Write-Host "   - Git (version control)" -ForegroundColor Gray
Write-Host "   - Node.js LTS (frontend runtime)" -ForegroundColor Gray
Write-Host "   - Go (backend services)" -ForegroundColor Gray
Write-Host "   - Python (ML/data science)" -ForegroundColor Gray
Write-Host "   - Docker Desktop (containers)" -ForegroundColor Gray
Write-Host "   - Bun (API runtime)" -ForegroundColor Gray
if ($installRust -eq "y" -or $installRust -eq "Y") {
    Write-Host "   - Rust (attribution engine)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your computer (required for Docker)" -ForegroundColor Yellow
Write-Host "   2. Start Docker Desktop" -ForegroundColor Yellow
Write-Host "   3. Run: docker-compose up -d (to start all services)" -ForegroundColor Yellow
Write-Host "   4. Verify services: docker-compose ps" -ForegroundColor Yellow
Write-Host ""
Write-Host "Service Endpoints (after docker-compose up):" -ForegroundColor Cyan
Write-Host "   - ClickHouse HTTP: http://localhost:8123" -ForegroundColor Gray
Write-Host "   - PostgreSQL: localhost:5432" -ForegroundColor Gray
Write-Host "   - Redis: localhost:6379" -ForegroundColor Gray
Write-Host "   - Kafka: localhost:9092" -ForegroundColor Gray
Write-Host "   - Kafka UI: http://localhost:8080" -ForegroundColor Gray
Write-Host ""
