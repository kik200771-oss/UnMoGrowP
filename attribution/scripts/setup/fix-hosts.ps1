# Fix hosts file - add missing domain entries
# Must run as Administrator

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

Write-Host "Fixing hosts file..." -ForegroundColor Cyan
Write-Host ""

# Create the entries as a single string
$entries = @"

127.0.0.1    unmogrowp.local
127.0.0.1    api.unmogrowp.local
127.0.0.1    kafka.unmogrowp.local
"@

try {
    # Append entries to hosts file
    $entries | Out-File -FilePath $hostsPath -Append -Encoding ASCII

    Write-Host "SUCCESS: Domains added to hosts file!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Added domains:" -ForegroundColor Yellow
    Write-Host "  127.0.0.1    unmogrowp.local" -ForegroundColor White
    Write-Host "  127.0.0.1    api.unmogrowp.local" -ForegroundColor White
    Write-Host "  127.0.0.1    kafka.unmogrowp.local" -ForegroundColor White
    Write-Host ""

    Write-Host "Flushing DNS cache..." -ForegroundColor Yellow
    ipconfig /flushdns | Out-Null
    Write-Host "DNS cache flushed!" -ForegroundColor Green
    Write-Host ""

    Write-Host "Now try in browser: http://unmogrowp.local:3000" -ForegroundColor Cyan

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add manually to hosts file:" -ForegroundColor Yellow
    Write-Host "127.0.0.1    unmogrowp.local" -ForegroundColor White
    Write-Host "127.0.0.1    api.unmogrowp.local" -ForegroundColor White
    Write-Host "127.0.0.1    kafka.unmogrowp.local" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
