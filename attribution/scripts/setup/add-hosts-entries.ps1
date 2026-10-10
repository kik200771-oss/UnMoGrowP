# Add UnMoGrowP domains to hosts file
# Run as Administrator

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

Write-Host "Adding domains to hosts file..." -ForegroundColor Yellow

# Read current content
$currentContent = Get-Content $hostsPath

# Domains to add
$domains = @(
    "127.0.0.1    unmogrowp.local",
    "127.0.0.1    api.unmogrowp.local",
    "127.0.0.1    kafka.unmogrowp.local"
)

# Check and add each domain
$modified = $false
foreach ($domain in $domains) {
    $domainName = $domain.Split()[1]
    if ($currentContent -notmatch [regex]::Escape($domainName)) {
        Add-Content -Path $hostsPath -Value $domain
        Write-Host "  Added: $domainName" -ForegroundColor Green
        $modified = $true
    } else {
        Write-Host "  Already exists: $domainName" -ForegroundColor Gray
    }
}

if ($modified) {
    Write-Host "`nFlushing DNS cache..." -ForegroundColor Yellow
    ipconfig /flushdns | Out-Null
    Write-Host "Done!" -ForegroundColor Green
    Write-Host "`nPlease try http://unmogrowp.local:3000 in browser" -ForegroundColor Cyan
} else {
    Write-Host "`nAll domains already exist" -ForegroundColor Green
}

Read-Host "`nPress Enter to exit"
