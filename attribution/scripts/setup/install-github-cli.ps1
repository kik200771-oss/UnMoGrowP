# Install GitHub CLI for Windows
# Run as Administrator

Write-Host "🚀 Installing GitHub CLI..." -ForegroundColor Green

# Check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey first..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install GitHub CLI
Write-Host "📦 Installing GitHub CLI via Chocolatey..." -ForegroundColor Yellow
choco install gh -y

# Verify installation
Write-Host "✅ Verifying GitHub CLI installation..." -ForegroundColor Green
gh --version

Write-Host "🎯 GitHub CLI installed successfully!" -ForegroundColor Green
Write-Host "🔑 Next step: Run 'gh auth login' to authenticate" -ForegroundColor Cyan