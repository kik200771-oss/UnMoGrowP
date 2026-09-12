# Direct GitHub CLI Installation Script
# Downloads and installs GitHub CLI directly

Write-Host "🚀 Installing GitHub CLI directly..." -ForegroundColor Green

$downloadUrl = "https://github.com/cli/cli/releases/latest/download/gh_windows_amd64.zip"
$tempPath = "$env:TEMP\gh_windows_amd64.zip"
$extractPath = "$env:TEMP\gh_extracted"
$installPath = "$env:LOCALAPPDATA\gh"

try {
    # Create installation directory
    if (!(Test-Path $installPath)) {
        New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    }

    # Download GitHub CLI
    Write-Host "📦 Downloading GitHub CLI..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempPath -UseBasicParsing

    # Extract archive
    Write-Host "📂 Extracting archive..." -ForegroundColor Yellow
    if (Test-Path $extractPath) {
        Remove-Item -Path $extractPath -Recurse -Force
    }
    Expand-Archive -Path $tempPath -DestinationPath $extractPath -Force

    # Find gh.exe and copy to install location
    $ghExeFiles = Get-ChildItem -Path $extractPath -Name "gh.exe" -Recurse
    if ($ghExeFiles.Count -gt 0) {
        $ghExePath = Get-ChildItem -Path $extractPath -Filter "gh.exe" -Recurse | Select-Object -First 1
        Copy-Item -Path $ghExePath.FullName -Destination "$installPath\gh.exe" -Force

        # Add to PATH for current session
        $env:PATH = "$installPath;$env:PATH"

        Write-Host "✅ GitHub CLI installed successfully!" -ForegroundColor Green
        Write-Host "📍 Location: $installPath\gh.exe" -ForegroundColor Cyan

        # Test installation
        & "$installPath\gh.exe" --version
    } else {
        Write-Host "❌ Could not find gh.exe in downloaded archive" -ForegroundColor Red
    }

    # Cleanup
    Remove-Item -Path $tempPath -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $extractPath -Recurse -Force -ErrorAction SilentlyContinue

} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
}