# Install ngrok for Windows
# Run as Administrator

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Installing ngrok" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Chocolatey is installed
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "Installing ngrok via Chocolatey..." -ForegroundColor Yellow
    choco install ngrok -y

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: ngrok installed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Create free account at: https://dashboard.ngrok.com/signup" -ForegroundColor White
        Write-Host "2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
        Write-Host "3. Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
        Write-Host "4. Run: ngrok http 3000" -ForegroundColor White
    }
} else {
    Write-Host "Chocolatey not found. Downloading ngrok manually..." -ForegroundColor Yellow
    Write-Host ""

    # Download ngrok
    $downloadUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    $zipPath = "$env:TEMP\ngrok.zip"
    $extractPath = "C:\ngrok"

    Write-Host "Downloading from: $downloadUrl" -ForegroundColor Gray

    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
        Write-Host "Download complete!" -ForegroundColor Green

        # Extract
        Write-Host "Extracting to: $extractPath" -ForegroundColor Yellow
        New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        if ($currentPath -notlike "*$extractPath*") {
            Write-Host "Adding to PATH..." -ForegroundColor Yellow
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$extractPath", "Machine")
            $env:Path = "$env:Path;$extractPath"
        }

        # Clean up
        Remove-Item $zipPath -Force

        Write-Host ""
        Write-Host "SUCCESS: ngrok installed to $extractPath!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Create free account at: https://dashboard.ngrok.com/signup" -ForegroundColor White
        Write-Host "2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
        Write-Host "3. Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
        Write-Host "4. Run: ngrok http 3000" -ForegroundColor White
        Write-Host ""
        Write-Host "Restart your terminal to use ngrok!" -ForegroundColor Cyan

    } catch {
        Write-Host ""
        Write-Host "ERROR: Failed to download/install ngrok" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual installation:" -ForegroundColor Yellow
        Write-Host "1. Download from: https://ngrok.com/download" -ForegroundColor White
        Write-Host "2. Extract ngrok.exe to C:\ngrok\" -ForegroundColor White
        Write-Host "3. Add C:\ngrok to PATH" -ForegroundColor White
    }
}

Write-Host ""
Read-Host "Press Enter to exit"
