# Restart Computer Script
# Required after Docker Desktop installation

Write-Host "Preparing to restart computer..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Make sure you've saved all your work!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Are you sure you want to restart now? (y/n)"

if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host ""
    Write-Host "Restarting computer in 10 seconds..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to cancel" -ForegroundColor Gray
    Start-Sleep -Seconds 10

    Restart-Computer -Force
} else {
    Write-Host ""
    Write-Host "Restart cancelled." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "When you're ready to restart:" -ForegroundColor Cyan
    Write-Host "  Option 1: Run this script again" -ForegroundColor Gray
    Write-Host "  Option 2: Start Menu -> Power -> Restart" -ForegroundColor Gray
    Write-Host "  Option 3: Run: Restart-Computer -Force" -ForegroundColor Gray
}
