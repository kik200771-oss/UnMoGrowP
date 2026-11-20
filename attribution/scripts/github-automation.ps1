# GitHub Automation Script for UnMoGrowP Attribution Platform (PowerShell)
# Automates PR creation, Issues creation, and repository setup

param(
    [string]$Action = "menu"
)

# Function to write colored output
function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColoredOutput "🚀 Starting GitHub Automation for UnMoGrowP Attribution Platform" Green

# Check if GitHub CLI is installed
try {
    $ghVersion = gh --version
    Write-ColoredOutput "✅ GitHub CLI found: $($ghVersion[0])" Green
} catch {
    Write-ColoredOutput "❌ GitHub CLI not found. Installing..." Red
    Write-ColoredOutput "📦 Please wait while installing GitHub CLI..." Yellow

    # Install via winget if available
    try {
        winget install GitHub.cli
        Write-ColoredOutput "✅ GitHub CLI installed via winget" Green
    } catch {
        Write-ColoredOutput "❌ winget failed. Please install manually:" Red
        Write-ColoredOutput "1. Run: scripts\setup\install-github-cli.ps1 as Administrator" Yellow
        Write-ColoredOutput "2. Or download from: https://cli.github.com/" Yellow
        exit 1
    }
}

# Check authentication
Write-ColoredOutput "🔑 Checking GitHub authentication..." Blue
try {
    gh auth status *>&1 | Out-Null
    Write-ColoredOutput "✅ Already authenticated" Green
} catch {
    Write-ColoredOutput "⚠️ Not authenticated. Please login:" Yellow
    gh auth login
}

# Function to create Pull Request
function Create-PullRequest {
    Write-ColoredOutput "📋 Creating Pull Request..." Blue

    # Ensure we're on the correct branch
    git checkout feature/migrate-to-svelte

    try {
        # Create PR using the description file
        gh pr create `
            --title "🚀 Engineering Process Implementation & Platform Development Consolidation" `
            --body-file "PR_DESCRIPTION.md" `
            --base main `
            --head feature/migrate-to-svelte `
            --assignee "@kik200771-oss"

        Write-ColoredOutput "✅ Pull Request created successfully!" Green

        # Get PR URL
        $prUrl = gh pr view --json url --jq .url
        Write-ColoredOutput "🔗 PR URL: $prUrl" Cyan
    } catch {
        Write-ColoredOutput "❌ Failed to create PR: $($_.Exception.Message)" Red
    }
}

# Function to create Issue #1: Svelte 5 Migration
function Create-IssueSvelte5 {
    Write-ColoredOutput "📝 Creating Issue #1: Svelte 5 Migration..." Blue

    try {
        gh issue create `
            --title "[EPIC] Svelte 5 Migration Plan - Attribution Platform Frontend" `
            --body-file "github-issues\issue-svelte5-migration.md" `
            --label "epic,frontend,svelte,migration,high-priority" `
            --assignee kik200771-oss

        Write-ColoredOutput "✅ Svelte 5 Migration issue created!" Green
    } catch {
        Write-ColoredOutput "❌ Failed to create Svelte 5 issue: $($_.Exception.Message)" Red
    }
}

# Function to create Issue #2: Build & CI/CD
function Create-IssueCICD {
    Write-ColoredOutput "📝 Creating Issue #2: Build & CI/CD..." Blue

    try {
        gh issue create `
            --title "[INFRA] Build & CI/CD Infrastructure Enhancement - Production-Ready Pipeline" `
            --body-file "github-issues\issue-build-cicd.md" `
            --label "infrastructure,ci-cd,build,production,high-priority" `
            --assignee kik200771-oss

        Write-ColoredOutput "✅ Build & CI/CD issue created!" Green
    } catch {
        Write-ColoredOutput "❌ Failed to create CI/CD issue: $($_.Exception.Message)" Red
    }
}

# Function to create Issue #3: Security & Secrets
function Create-IssueSecurity {
    Write-ColoredOutput "📝 Creating Issue #3: Security & Secrets..." Blue

    try {
        gh issue create `
            --title "[SECURITY] Security & Secrets Management Enhancement - Enterprise-Grade Protection" `
            --body-file "github-issues\issue-security-secrets.md" `
            --label "security,secrets,compliance,critical,infrastructure" `
            --assignee kik200771-oss

        Write-ColoredOutput "✅ Security & Secrets issue created!" Green
    } catch {
        Write-ColoredOutput "❌ Failed to create Security issue: $($_.Exception.Message)" Red
    }
}

# Function to show manual steps
function Show-ManualSteps {
    Write-ColoredOutput "⚙️ Manual steps required in GitHub web interface:" Yellow
    Write-Host ""
    Write-ColoredOutput "1. Branch Protection Rules:" Blue
    Write-Host "   🔗 https://github.com/kik200771-oss/UnMoGrowP/settings/branches"
    Write-Host "   • Add rule for 'main' branch"
    Write-Host "   • Require 2 PR approvals"
    Write-Host "   • Require CODEOWNERS review"
    Write-Host "   • Require status checks to pass"
    Write-Host ""
    Write-ColoredOutput "2. Repository Features:" Blue
    Write-Host "   🔗 https://github.com/kik200771-oss/UnMoGrowP/settings"
    Write-Host "   • Enable Issues, Projects, Wiki, Discussions"
    Write-Host "   • Enable all Security features"
    Write-Host "   • Configure Pull Request settings"
    Write-Host ""

    # Open URLs automatically
    $response = Read-Host "Open GitHub settings in browser? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Start-Process "https://github.com/kik200771-oss/UnMoGrowP/settings/branches"
        Start-Process "https://github.com/kik200771-oss/UnMoGrowP/settings"
    }
}

# Function to verify setup
function Verify-Setup {
    Write-ColoredOutput "🔍 Verifying GitHub setup..." Blue

    try {
        # Check PRs
        $prList = gh pr list --base main --head feature/migrate-to-svelte --json number,title,url | ConvertFrom-Json
        if ($prList.Count -gt 0) {
            Write-ColoredOutput "✅ Pull Request exists:" Green
            foreach ($pr in $prList) {
                Write-Host "   #$($pr.number): $($pr.title)"
                Write-Host "   🔗 $($pr.url)"
            }
        } else {
            Write-ColoredOutput "❌ Pull Request not found" Red
        }

        # Check issues
        Write-ColoredOutput "📋 Recent Issues:" Blue
        $issues = gh issue list --limit 5 --json number,title,labels | ConvertFrom-Json
        foreach ($issue in $issues) {
            $labels = ($issue.labels | ForEach-Object { $_.name }) -join ", "
            Write-Host "   #$($issue.number): $($issue.title)"
            Write-Host "   🏷️ Labels: $labels"
        }

        # Count issues by type
        $allIssues = gh issue list --json labels | ConvertFrom-Json
        $epicCount = ($allIssues | Where-Object { $_.labels.name -contains "epic" }).Count
        $infraCount = ($allIssues | Where-Object { $_.labels.name -contains "infrastructure" }).Count
        $securityCount = ($allIssues | Where-Object { $_.labels.name -contains "security" }).Count

        Write-ColoredOutput "📊 Issue Summary:" Green
        Write-Host "   • Epic issues: $epicCount"
        Write-Host "   • Infrastructure issues: $infraCount"
        Write-Host "   • Security issues: $securityCount"

    } catch {
        Write-ColoredOutput "❌ Error verifying setup: $($_.Exception.Message)" Red
    }
}

# Function to run complete automation
function Complete-Automation {
    Write-ColoredOutput "🚀 Running complete automation..." Green

    Create-PullRequest
    Start-Sleep -Seconds 2

    Create-IssueSvelte5
    Start-Sleep -Seconds 1

    Create-IssueCICD
    Start-Sleep -Seconds 1

    Create-IssueSecurity
    Start-Sleep -Seconds 1

    Write-Host ""
    Write-ColoredOutput "🎉 Automation complete!" Green

    Show-ManualSteps
    Verify-Setup
}

# Main menu function
function Show-Menu {
    Write-ColoredOutput "🎯 GitHub Automation Menu:" Blue
    Write-Host "1. Create Pull Request"
    Write-Host "2. Create All Issues"
    Write-Host "3. Create Individual Issues"
    Write-Host "4. Show Manual Setup Steps"
    Write-Host "5. Verify Setup"
    Write-Host "6. Complete Automation (All Steps)"
    Write-Host "7. Open Repository in Browser"
    Write-Host ""

    $choice = Read-Host "Select option (1-7)"

    switch ($choice) {
        "1" { Create-PullRequest }
        "2" {
            Create-IssueSvelte5
            Create-IssueCICD
            Create-IssueSecurity
        }
        "3" {
            Write-Host "Select issue to create:"
            Write-Host "a) Svelte 5 Migration"
            Write-Host "b) Build & CI/CD"
            Write-Host "c) Security & Secrets"
            $issueChoice = Read-Host "Choice (a/b/c)"
            switch ($issueChoice) {
                "a" { Create-IssueSvelte5 }
                "b" { Create-IssueCICD }
                "c" { Create-IssueSecurity }
                default { Write-ColoredOutput "Invalid choice" Red }
            }
        }
        "4" { Show-ManualSteps }
        "5" { Verify-Setup }
        "6" { Complete-Automation }
        "7" { Start-Process "https://github.com/kik200771-oss/UnMoGrowP" }
        default { Write-ColoredOutput "Invalid option" Red }
    }
}

# Check if we're in the right directory
if (!(Test-Path "MASTER_PROJECT_CONTEXT.md")) {
    Write-ColoredOutput "❌ Please run this script from the attribution project root directory" Red
    exit 1
}

# Main execution based on parameter
switch ($Action) {
    "pr" { Create-PullRequest }
    "issues" {
        Create-IssueSvelte5
        Create-IssueCICD
        Create-IssueSecurity
    }
    "all" { Complete-Automation }
    "verify" { Verify-Setup }
    default { Show-Menu }
}

Write-Host ""
Write-ColoredOutput "🎯 GitHub automation completed!" Green
Write-ColoredOutput "📊 Repository: https://github.com/kik200771-oss/UnMoGrowP" Blue
Write-ColoredOutput "⚙️ Complete manual steps for full activation" Yellow