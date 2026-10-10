Write-Host "Installing GitHub CLI..." -ForegroundColor Green

$downloadUrl = "https://github.com/cli/cli/releases/latest/download/gh_windows_amd64.zip"
$tempPath = "$env:TEMP\gh_windows_amd64.zip"
$extractPath = "$env:TEMP\gh_extracted"
$installPath = "$env:LOCALAPPDATA\gh"

# Create installation directory
New-Item -ItemType Directory -Path $installPath -Force | Out-Null

# Download GitHub CLI
Write-Host "Downloading GitHub CLI..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $tempPath -UseBasicParsing

# Extract archive
Write-Host "Extracting archive..."
Expand-Archive -Path $tempPath -DestinationPath $extractPath -Force

# Copy gh.exe to install location
$ghExePath = Get-ChildItem -Path $extractPath -Filter "gh.exe" -Recurse | Select-Object -First 1
if ($ghExePath) {
    Copy-Item -Path $ghExePath.FullName -Destination "$installPath\gh.exe" -Force
    $env:PATH = "$installPath;$env:PATH"
    Write-Host "GitHub CLI installed successfully!"
    & "$installPath\gh.exe" --version
} else {
    Write-Host "Could not find gh.exe"
}

# Cleanup
Remove-Item -Path $tempPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $extractPath -Recurse -Force -ErrorAction SilentlyContinue