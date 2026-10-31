# Complete GitHub Activation Script - Fully Automated PowerShell Version
# Uses GitHub API with maximum automation

param(
    [string]$Token = $env:GITHUB_TOKEN,
    [string]$Owner = "kik200771-oss",
    [string]$Repo = "UnMoGrowP"
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

$baseUrl = "https://api.github.com/repos/$Owner/$Repo"

Write-ColorOutput "🚀 UnMoGrowP GitHub Auto-Activation Starting..." Green

# Function to check repository status
function Test-Repository {
    Write-ColorOutput "🔍 Checking repository status..." Blue

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Get
        Write-ColorOutput "✅ Repository accessible" Green

        Write-ColorOutput "📊 Repository Status:" Blue
        Write-Host "   Issues: $($response.has_issues)"
        Write-Host "   Projects: $($response.has_projects)"
        Write-Host "   Wiki: $($response.has_wiki)"
        Write-Host "   Default Branch: $($response.default_branch)"
        Write-Host "   Open Issues: $($response.open_issues_count)"

        return $response
    } catch {
        Write-ColorOutput "❌ Cannot access repository: $($_.Exception.Message)" Red
        return $null
    }
}

# Function to create Pull Request
function New-PullRequest {
    Write-ColorOutput "📋 Creating Pull Request..." Blue

    $prBody = ""
    if (Test-Path "PR_DESCRIPTION.md") {
        $prBody = Get-Content "PR_DESCRIPTION.md" -Raw
    } else {
        $prBody = "Engineering Process Implementation & Platform Development Consolidation - Complete platform implementation with professional GitHub workflow."
    }

    $prData = @{
        title = "🚀 Engineering Process Implementation & Platform Development Consolidation"
        head = "feature/migrate-to-svelte"
        base = "main"
        body = $prBody
        draft = $false
    }

    $headers = @{
        "Accept" = "application/vnd.github.v3+json"
        "User-Agent" = "UnMoGrowP-Automation"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/pulls" -Method Post -Headers $headers -Body ($prData | ConvertTo-Json) -ContentType "application/json"
        Write-ColorOutput "✅ Pull Request created successfully!" Green
        Write-ColorOutput "🔗 PR URL: $($response.html_url)" Cyan
        return $true
    } catch {
        Write-ColorOutput "⚠️ PR creation requires authentication" Yellow
        Write-ColorOutput "📋 PR Details Ready:" Blue
        Write-Host "   Title: 🚀 Engineering Process Implementation & Platform Development Consolidation"
        Write-Host "   Head: feature/migrate-to-svelte"
        Write-Host "   Base: main"
        Write-Host "   URL: https://github.com/$Owner/$Repo/compare/main...feature/migrate-to-svelte"
        return $false
    }
}

# Function to create Issues
function New-Issues {
    Write-ColorOutput "📝 Creating Issues..." Blue

    $issues = @(
        @{
            title = "[EPIC] Svelte 5 Migration Plan - Attribution Platform Frontend"
            file = "github-issues\issue-svelte5-migration.md"
            labels = @("epic", "frontend", "svelte", "migration", "high-priority")
        },
        @{
            title = "[INFRA] Build & CI/CD Infrastructure Enhancement - Production-Ready Pipeline"
            file = "github-issues\issue-build-cicd.md"
            labels = @("infrastructure", "ci-cd", "build", "production", "high-priority")
        },
        @{
            title = "[SECURITY] Security & Secrets Management Enhancement - Enterprise-Grade Protection"
            file = "github-issues\issue-security-secrets.md"
            labels = @("security", "secrets", "compliance", "critical", "infrastructure")
        }
    )

    $headers = @{
        "Accept" = "application/vnd.github.v3+json"
        "User-Agent" = "UnMoGrowP-Automation"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $successCount = 0

    foreach ($issue in $issues) {
        Write-ColorOutput "Creating Issue: $($issue.title)" Blue

        $issueBody = ""
        if (Test-Path $issue.file) {
            $issueBody = Get-Content $issue.file -Raw
        } else {
            $issueBody = "Issue content for $($issue.title)"
        }

        $issueData = @{
            title = $issue.title
            body = $issueBody
            labels = $issue.labels
            assignees = @($Owner)
        }

        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/issues" -Method Post -Headers $headers -Body ($issueData | ConvertTo-Json) -ContentType "application/json"
            Write-ColorOutput "✅ Issue #$($response.number) created!" Green
            Write-ColorOutput "🔗 URL: $($response.html_url)" Cyan
            $successCount++
        } catch {
            Write-ColorOutput "⚠️ Issue creation requires authentication" Yellow
            Write-ColorOutput "📋 Issue Details Ready: $($issue.title)" Blue
        }
    }

    return $successCount
}

# Function to open GitHub pages
function Open-GitHubPages {
    Write-ColorOutput "🌐 Opening GitHub pages..." Blue

    # Open PR creation page
    Start-Process "https://github.com/$Owner/$Repo/compare/main...feature/migrate-to-svelte"
    Start-Sleep 2

    # Open Issues creation page
    Start-Process "https://github.com/$Owner/$Repo/issues/new/choose"
    Start-Sleep 2

    # Open branch protection settings
    Start-Process "https://github.com/$Owner/$Repo/settings/branches"
    Start-Sleep 2

    # Open repository settings
    Start-Process "https://github.com/$Owner/$Repo/settings"

    Write-ColorOutput "✅ All GitHub pages opened in browser" Green
}

# Function to show manual instructions
function Show-ManualInstructions {
    Write-ColorOutput "📋 Manual GitHub Setup Instructions:" Yellow
    Write-Host ""
    Write-ColorOutput "1. CREATE PULL REQUEST:" Blue
    Write-Host "   URL: https://github.com/$Owner/$Repo/compare/main...feature/migrate-to-svelte"
    Write-Host "   Title: 🚀 Engineering Process Implementation & Platform Development Consolidation"
    Write-Host "   Description: Copy from PR_DESCRIPTION.md"
    Write-Host ""
    Write-ColorOutput "2. CREATE 3 ISSUES:" Blue
    Write-Host "   URL: https://github.com/$Owner/$Repo/issues/new/choose"
    Write-Host "   Issue #1: Copy from github-issues\issue-svelte5-migration.md"
    Write-Host "   Issue #2: Copy from github-issues\issue-build-cicd.md"
    Write-Host "   Issue #3: Copy from github-issues\issue-security-secrets.md"
    Write-Host ""
    Write-ColorOutput "3. BRANCH PROTECTION:" Blue
    Write-Host "   URL: https://github.com/$Owner/$Repo/settings/branches"
    Write-Host "   Add rule for 'main' branch with 2 PR approvals"
    Write-Host ""
    Write-ColorOutput "4. REPOSITORY SETTINGS:" Blue
    Write-Host "   URL: https://github.com/$Owner/$Repo/settings"
    Write-Host "   Enable all Security features"
}

# Function to show token instructions
function Show-TokenInstructions {
    Write-ColorOutput "🔑 For Full Automation, Create GitHub Token:" Blue
    Write-Host ""
    Write-ColorOutput "1. Go to: https://github.com/settings/tokens" Yellow
    Write-ColorOutput "2. Click 'Generate new token (classic)'" Yellow
    Write-ColorOutput "3. Select scopes: repo, workflow" Yellow
    Write-ColorOutput "4. Copy the token" Yellow
    Write-ColorOutput "5. Run: `$env:GITHUB_TOKEN='your_token_here'" Yellow
    Write-ColorOutput "6. Re-run this script" Yellow
    Write-Host ""
    Write-ColorOutput "Or run with token parameter:" Blue
    Write-ColorOutput "powershell -ExecutionPolicy Bypass -File scripts\auto-activate-github.ps1 -Token 'your_token'" Yellow
}

# Main execution
function Start-Activation {
    # Check repository
    $repo = Test-Repository
    if (-not $repo) {
        return
    }

    Write-Host ""
    Write-ColorOutput "🚀 Starting GitHub Activation..." Green

    # Try to create PR
    $prSuccess = New-PullRequest

    Write-Host ""

    # Try to create Issues
    $issuesCreated = New-Issues

    Write-Host ""

    # Open browser pages
    Open-GitHubPages

    Write-Host ""

    # Show results
    Write-ColorOutput "📊 Activation Summary:" Green
    Write-Host "   Pull Request: $(if($prSuccess) { "✅ Created" } else { "📋 Ready for manual creation" })"
    Write-Host "   Issues: ✅ $issuesCreated/3 created"
    Write-Host "   Browser Pages: ✅ Opened"
    Write-Host "   Content Files: ✅ Ready"

    Write-Host ""

    if (-not $prSuccess -or $issuesCreated -lt 3) {
        if (-not $Token) {
            Show-TokenInstructions
            Write-Host ""
        }
        Show-ManualInstructions
    }

    Write-Host ""
    Write-ColorOutput "🎯 GitHub activation process completed!" Green
    Write-ColorOutput "📊 Repository: https://github.com/$Owner/$Repo" Blue
}

# Check if we're in the right directory
if (-not (Test-Path "MASTER_PROJECT_CONTEXT.md")) {
    Write-ColorOutput "❌ Please run this script from the attribution project root directory" Red
    exit 1
}

# Run main function
Start-Activation