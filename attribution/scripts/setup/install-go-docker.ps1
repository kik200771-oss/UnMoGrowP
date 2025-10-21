# Install Go and Docker Desktop with Administrator privileges
# Run this script as Administrator

Write-Host "Installing Go and Docker Desktop..." -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Right-click on PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or run this command in Administrator PowerShell:" -ForegroundColor Cyan
    Write-Host "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File ""$PSCommandPath""'" -ForegroundColor Gray
    exit 1
}

Write-Host "Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Check Chocolatey
try {
    choco --version | Out-Null
    Write-Host "Chocolatey is available" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Chocolatey not found. Please install Chocolatey first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install Go
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Installing Go" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow

choco install golang -y

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Go installed successfully!" -ForegroundColor Green

    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # Try to verify
    try {
        $goVersion = & go version 2>&1
        Write-Host "Verified: $goVersion" -ForegroundColor Green
    } catch {
        Write-Host "Go installed but not yet in PATH. Please restart terminal." -ForegroundColor Yellow
    }
} else {
    Write-Host "Failed to install Go" -ForegroundColor Red
}

Write-Host ""

# Install Docker Desktop
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Installing Docker Desktop" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Note: This may take several minutes..." -ForegroundColor Gray

choco install docker-desktop -y

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Docker Desktop installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to install Docker Desktop" -ForegroundColor Red
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. RESTART YOUR COMPUTER (required for Docker)" -ForegroundColor Yellow
Write-Host "2. After restart, start Docker Desktop from Start Menu" -ForegroundColor Yellow
Write-Host "3. Wait for Docker to fully start (icon in system tray)" -ForegroundColor Yellow
Write-Host "4. Open PowerShell and run:" -ForegroundColor Yellow
Write-Host "   cd C:\КОДИНГ\attribution" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "To verify installations after restart:" -ForegroundColor Cyan
Write-Host "   go version" -ForegroundColor Gray
Write-Host "   docker --version" -ForegroundColor Gray
Write-Host ""
