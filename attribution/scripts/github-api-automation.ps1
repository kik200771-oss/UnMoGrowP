# GitHub API Automation Script
# Creates PR and Issues using GitHub REST API without requiring GitHub CLI

param(
    [string]$Token = "",
    [string]$Owner = "kik200771-oss",
    [string]$Repo = "UnMoGrowP"
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "🚀 GitHub API Automation Starting..." Green

# Check if token is provided
if (-not $Token) {
    Write-ColorOutput "⚠️ GitHub token required. Options:" Yellow
    Write-ColorOutput "1. Set GITHUB_TOKEN environment variable" Cyan
    Write-ColorOutput "2. Pass token as parameter: -Token 'your_token_here'" Cyan
    Write-ColorOutput "3. Create token at: https://github.com/settings/tokens" Cyan

    $Token = $env:GITHUB_TOKEN
    if (-not $Token) {
        $Token = Read-Host "Enter GitHub token (or press Enter to open browser for manual setup)"
        if (-not $Token) {
            Write-ColorOutput "Opening GitHub for manual setup..." Yellow
            Start-Process "https://github.com/$Owner/$Repo/compare/main...feature/migrate-to-svelte"
            Start-Process "https://github.com/$Owner/$Repo/issues/new/choose"
            return
        }
    }
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "UnMoGrowP-Automation"
}

$baseUrl = "https://api.github.com/repos/$Owner/$Repo"

# Function to create Pull Request
function Create-PullRequest {
    Write-ColorOutput "📋 Creating Pull Request..." Blue

    $prBody = Get-Content "PR_DESCRIPTION.md" -Raw -ErrorAction SilentlyContinue
    if (-not $prBody) {
        $prBody = "Engineering Process Implementation & Platform Development Consolidation - Complete platform implementation with professional GitHub workflow."
    }

    $prData = @{
        title = "🚀 Engineering Process Implementation & Platform Development Consolidation"
        head = "feature/migrate-to-svelte"
        base = "main"
        body = $prBody
        draft = $false
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/pulls" -Method Post -Headers $headers -Body $prData -ContentType "application/json"
        Write-ColorOutput "✅ Pull Request created successfully!" Green
        Write-ColorOutput "🔗 URL: $($response.html_url)" Cyan
        return $response
    } catch {
        Write-ColorOutput "❌ Failed to create PR: $($_.Exception.Message)" Red
        return $null
    }
}

# Function to create Issues
function Create-Issue {
    param([string]$Title, [string]$BodyFile, [string[]]$Labels)

    Write-ColorOutput "📝 Creating Issue: $Title" Blue

    $issueBody = Get-Content $BodyFile -Raw -ErrorAction SilentlyContinue
    if (-not $issueBody) {
        $issueBody = "Issue content from $BodyFile"
    }

    $issueData = @{
        title = $Title
        body = $issueBody
        labels = $Labels
        assignees = @($Owner)
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/issues" -Method Post -Headers $headers -Body $issueData -ContentType "application/json"
        Write-ColorOutput "✅ Issue created: #$($response.number)" Green
        Write-ColorOutput "🔗 URL: $($response.html_url)" Cyan
        return $response
    } catch {
        Write-ColorOutput "❌ Failed to create issue: $($_.Exception.Message)" Red
        return $null
    }
}

# Function to check repository status
function Check-Repository {
    Write-ColorOutput "🔍 Checking repository status..." Blue

    try {
        $repo = Invoke-RestMethod -Uri $baseUrl -Headers $headers
        Write-ColorOutput "✅ Repository accessible: $($repo.full_name)" Green
        Write-ColorOutput "📊 Stars: $($repo.stargazers_count), Forks: $($repo.forks_count)" Cyan
        return $true
    } catch {
        Write-ColorOutput "❌ Cannot access repository: $($_.Exception.Message)" Red
        return $false
    }
}

# Main execution
Write-ColorOutput "🔐 Testing GitHub API access..." Blue

if (-not (Check-Repository)) {
    Write-ColorOutput "❌ Cannot proceed without repository access" Red
    return
}

# Create Pull Request
$pr = Create-PullRequest

# Create Issues
$issues = @()

Write-ColorOutput "📝 Creating Issues..." Blue

$issues += Create-Issue -Title "[EPIC] Svelte 5 Migration Plan - Attribution Platform Frontend" -BodyFile "github-issues\issue-svelte5-migration.md" -Labels @("epic", "frontend", "svelte", "migration", "high-priority")

$issues += Create-Issue -Title "[INFRA] Build & CI/CD Infrastructure Enhancement - Production-Ready Pipeline" -BodyFile "github-issues\issue-build-cicd.md" -Labels @("infrastructure", "ci-cd", "build", "production", "high-priority")

$issues += Create-Issue -Title "[SECURITY] Security & Secrets Management Enhancement - Enterprise-Grade Protection" -BodyFile "github-issues\issue-security-secrets.md" -Labels @("security", "secrets", "compliance", "critical", "infrastructure")

# Summary
Write-ColorOutput "`n🎉 Automation Summary:" Green
Write-ColorOutput "📋 Pull Request: $(if($pr) { "✅ Created" } else { "❌ Failed" })" $(if($pr) { "Green" } else { "Red" })
Write-ColorOutput "📝 Issues Created: $($issues.Count)/3" $(if($issues.Count -eq 3) { "Green" } else { "Yellow" })

if ($pr -or $issues.Count -gt 0) {
    Write-ColorOutput "`n🔗 Next steps:" Yellow
    Write-ColorOutput "1. Configure branch protection: https://github.com/$Owner/$Repo/settings/branches" Cyan
    Write-ColorOutput "2. Enable repository features: https://github.com/$Owner/$Repo/settings" Cyan
    Write-ColorOutput "3. Review created items: https://github.com/$Owner/$Repo" Cyan
}

Write-ColorOutput "`n🎯 GitHub automation completed!" Green