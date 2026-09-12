# Setup Local Domain for UnMoGrowP
# This script configures local domain unmogrowp.local and subdomains

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  UnMoGrowP Local Domain Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Cyan
    Write-Host "  1. Right-click on PowerShell" -ForegroundColor White
    Write-Host "  2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "  3. Run this command:" -ForegroundColor White
    Write-Host "     cd C:\КОДИНГ\attribution" -ForegroundColor Green
    Write-Host "     .\setup-local-domain.ps1" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "SUCCESS: Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Hosts file path
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

# Backup hosts file
$backupPath = "C:\Windows\System32\drivers\etc\hosts.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Creating backup of hosts file..." -ForegroundColor Yellow
Copy-Item $hostsPath $backupPath
Write-Host "  Backup saved to: $backupPath" -ForegroundColor Gray
Write-Host ""

# Read current hosts file
$hostsContent = Get-Content $hostsPath -Raw

# Define domains to add
$domains = @(
    "unmogrowp.local",
    "api.unmogrowp.local",
    "kafka.unmogrowp.local"
)

# Check if domains already exist
$hostsNeedUpdate = $false
foreach ($domain in $domains) {
    if ($hostsContent -notmatch [regex]::Escape($domain)) {
        $hostsNeedUpdate = $true
        break
    }
}

if ($hostsNeedUpdate) {
    Write-Host "Adding domains to hosts file..." -ForegroundColor Yellow

    # Add header comment if not exists
    $header = "`n# UnMoGrowP Local Development Domains"
    if ($hostsContent -notmatch [regex]::Escape("UnMoGrowP Local Development")) {
        Add-Content -Path $hostsPath -Value $header
    }

    # Add each domain
    foreach ($domain in $domains) {
        if ($hostsContent -notmatch [regex]::Escape($domain)) {
            $entry = "127.0.0.1    $domain"
            Add-Content -Path $hostsPath -Value $entry
            Write-Host "  SUCCESS: Added $domain" -ForegroundColor Green
        } else {
            Write-Host "  SKIP: Already exists $domain" -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "SUCCESS: Hosts file updated successfully!" -ForegroundColor Green
} else {
    Write-Host "SUCCESS: All domains already configured in hosts file" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configured Domains:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Frontend:  http://unmogrowp.local:3000" -ForegroundColor Green
Write-Host "     Next.js application" -ForegroundColor Gray
Write-Host ""
Write-Host "  API:       http://api.unmogrowp.local:8000" -ForegroundColor Green
Write-Host "     Go backend API (when ready)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Kafka UI:  http://kafka.unmogrowp.local:8080" -ForegroundColor Green
Write-Host "     Kafka management interface" -ForegroundColor Gray
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Flush DNS cache:" -ForegroundColor Yellow
Write-Host "   ipconfig /flushdns" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Next.js development server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Open in browser:" -ForegroundColor Yellow
Write-Host "   http://unmogrowp.local:3000" -ForegroundColor White
Write-Host ""
Write-Host "4. Verify DNS resolution:" -ForegroundColor Yellow
Write-Host "   ping unmogrowp.local" -ForegroundColor White
Write-Host ""

Write-Host "TIP: If DNS doesn't resolve immediately, try:" -ForegroundColor Cyan
Write-Host "   ipconfig /flushdns" -ForegroundColor White
Write-Host ""

# Automatically flush DNS
Write-Host "Flushing DNS cache..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
Write-Host "DNS cache flushed!" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
