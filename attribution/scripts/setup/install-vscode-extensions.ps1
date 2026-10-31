# VS Code Extensions Installation Script
# UnMoGrowP Development Environment Setup

Write-Host "Installing VS Code Extensions for UnMoGrowP..." -ForegroundColor Green
Write-Host ""

# Function to install extension
function Install-VSCodeExtension {
    param (
        [string]$ExtensionId,
        [string]$Description
    )

    Write-Host "Installing: $Description" -ForegroundColor Cyan
    Write-Host "   Extension ID: $ExtensionId" -ForegroundColor Gray

    code --install-extension $ExtensionId

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "   Failed to install" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "FRONTEND DEVELOPMENT" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "dsznajder.es7-react-js-snippets" "ES7+ React/Redux/React-Native snippets"
Install-VSCodeExtension "dbaeumer.vscode-eslint" "ESLint"
Install-VSCodeExtension "esbenp.prettier-vscode" "Prettier - Code formatter"
Install-VSCodeExtension "bradlc.vscode-tailwindcss" "Tailwind CSS IntelliSense"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "BACKEND DEVELOPMENT" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "golang.go" "Go Official"
Install-VSCodeExtension "premparihar.gotestexplorer" "Go Test Explorer"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "DATABASE AND QUERY TOOLS" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "mtxr.sqltools" "SQLTools"
Install-VSCodeExtension "cweijan.vscode-redis-client" "Redis Client"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "DEVOPS AND CONTAINERS" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "ms-azuretools.vscode-docker" "Docker"
Install-VSCodeExtension "ms-kubernetes-tools.vscode-kubernetes-tools" "Kubernetes"
Install-VSCodeExtension "redhat.vscode-yaml" "YAML"
Install-VSCodeExtension "hashicorp.terraform" "HashiCorp Terraform"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "GIT AND VERSION CONTROL" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "eamodio.gitlens" "GitLens"
Install-VSCodeExtension "mhutchie.git-graph" "Git Graph"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "AI AND ML" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "ms-toolsai.jupyter" "Jupyter"
Install-VSCodeExtension "ms-python.python" "Python"
Install-VSCodeExtension "ms-python.vscode-pylance" "Pylance"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "PRODUCTIVITY" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "christian-kohler.path-intellisense" "Path Intellisense"
Install-VSCodeExtension "formulahendry.auto-rename-tag" "Auto Rename Tag"
Install-VSCodeExtension "usernamehw.errorlens" "Error Lens"
Install-VSCodeExtension "gruntfuggly.todo-tree" "Todo Tree"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "CODE QUALITY" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "sonarsource.sonarlint-vscode" "SonarLint"
Install-VSCodeExtension "aaron-bond.better-comments" "Better Comments"
Install-VSCodeExtension "streetsidesoftware.code-spell-checker" "Code Spell Checker"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "MARKDOWN AND DOCUMENTATION" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "yzhang.markdown-all-in-one" "Markdown All in One"
Install-VSCodeExtension "shd101wyy.markdown-preview-enhanced" "Markdown Preview Enhanced"
Install-VSCodeExtension "bierner.markdown-mermaid" "Markdown Preview Mermaid"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "API TESTING" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "humao.rest-client" "REST Client"
Install-VSCodeExtension "rangav.vscode-thunder-client" "Thunder Client"

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "THEME AND UI" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Install-VSCodeExtension "pkief.material-icon-theme" "Material Icon Theme"
Install-VSCodeExtension "zhuangtongfa.material-theme" "One Dark Pro"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   - Frontend: 4 extensions" -ForegroundColor Gray
Write-Host "   - Backend: 2 extensions" -ForegroundColor Gray
Write-Host "   - Database: 2 extensions" -ForegroundColor Gray
Write-Host "   - DevOps: 4 extensions" -ForegroundColor Gray
Write-Host "   - Git: 2 extensions" -ForegroundColor Gray
Write-Host "   - AI/ML: 3 extensions" -ForegroundColor Gray
Write-Host "   - Productivity: 4 extensions" -ForegroundColor Gray
Write-Host "   - Code Quality: 3 extensions" -ForegroundColor Gray
Write-Host "   - Markdown: 3 extensions" -ForegroundColor Gray
Write-Host "   - API Testing: 2 extensions" -ForegroundColor Gray
Write-Host "   - Theme: 2 extensions" -ForegroundColor Gray
Write-Host ""
Write-Host "   TOTAL: 31 extensions installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Please restart VS Code to activate all extensions." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart VS Code" -ForegroundColor Gray
Write-Host "   2. Configure extensions" -ForegroundColor Gray
Write-Host "   3. Install local services" -ForegroundColor Gray
Write-Host ""
