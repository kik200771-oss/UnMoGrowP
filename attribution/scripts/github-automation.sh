#!/bin/bash
# GitHub Automation Script for UnMoGrowP Attribution Platform
# Automates PR creation, Issues creation, and repository setup

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting GitHub Automation for UnMoGrowP Attribution Platform${NC}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found. Please install it first:${NC}"
    echo -e "${YELLOW}Windows: Run scripts/setup/install-github-cli.ps1 as Administrator${NC}"
    echo -e "${YELLOW}Mac: brew install gh${NC}"
    echo -e "${YELLOW}Linux: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg${NC}"
    exit 1
fi

# Check authentication
echo -e "${BLUE}🔑 Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️ Not authenticated. Please login:${NC}"
    gh auth login
fi

echo -e "${GREEN}✅ GitHub CLI ready!${NC}"

# Function to create PR
create_pull_request() {
    echo -e "${BLUE}📋 Creating Pull Request...${NC}"

    # Ensure we're on the correct branch
    git checkout feature/migrate-to-svelte

    # Create PR using the description file
    gh pr create \
        --title "🚀 Engineering Process Implementation & Platform Development Consolidation" \
        --body-file "PR_DESCRIPTION.md" \
        --base main \
        --head feature/migrate-to-svelte \
        --assignee @kik200771-oss

    echo -e "${GREEN}✅ Pull Request created successfully!${NC}"
}

# Function to create Issue #1: Svelte 5 Migration
create_issue_svelte5() {
    echo -e "${BLUE}📝 Creating Issue #1: Svelte 5 Migration...${NC}"

    gh issue create \
        --title "[EPIC] Svelte 5 Migration Plan - Attribution Platform Frontend" \
        --body-file "github-issues/issue-svelte5-migration.md" \
        --label "epic,frontend,svelte,migration,high-priority" \
        --assignee kik200771-oss

    echo -e "${GREEN}✅ Svelte 5 Migration issue created!${NC}"
}

# Function to create Issue #2: Build & CI/CD
create_issue_cicd() {
    echo -e "${BLUE}📝 Creating Issue #2: Build & CI/CD...${NC}"

    gh issue create \
        --title "[INFRA] Build & CI/CD Infrastructure Enhancement - Production-Ready Pipeline" \
        --body-file "github-issues/issue-build-cicd.md" \
        --label "infrastructure,ci-cd,build,production,high-priority" \
        --assignee kik200771-oss

    echo -e "${GREEN}✅ Build & CI/CD issue created!${NC}"
}

# Function to create Issue #3: Security & Secrets
create_issue_security() {
    echo -e "${BLUE}📝 Creating Issue #3: Security & Secrets...${NC}"

    gh issue create \
        --title "[SECURITY] Security & Secrets Management Enhancement - Enterprise-Grade Protection" \
        --body-file "github-issues/issue-security-secrets.md" \
        --label "security,secrets,compliance,critical,infrastructure" \
        --assignee kik200771-oss

    echo -e "${GREEN}✅ Security & Secrets issue created!${NC}"
}

# Function to display repository settings instructions
show_manual_steps() {
    echo -e "${YELLOW}⚙️ Manual steps required in GitHub web interface:${NC}"
    echo ""
    echo -e "${BLUE}1. Branch Protection Rules:${NC}"
    echo "   🔗 https://github.com/kik200771-oss/UnMoGrowP/settings/branches"
    echo "   • Add rule for 'main' branch"
    echo "   • Require 2 PR approvals"
    echo "   • Require CODEOWNERS review"
    echo "   • Require status checks to pass"
    echo ""
    echo -e "${BLUE}2. Repository Features:${NC}"
    echo "   🔗 https://github.com/kik200771-oss/UnMoGrowP/settings"
    echo "   • Enable Issues, Projects, Wiki, Discussions"
    echo "   • Enable all Security features"
    echo "   • Configure Pull Request settings"
    echo ""
}

# Function to verify setup
verify_setup() {
    echo -e "${BLUE}🔍 Verifying GitHub setup...${NC}"

    # Check if PR exists
    PR_COUNT=$(gh pr list --base main --head feature/migrate-to-svelte --json number | jq length)
    if [ "$PR_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Pull Request exists${NC}"
        gh pr list --base main --head feature/migrate-to-svelte
    else
        echo -e "${RED}❌ Pull Request not found${NC}"
    fi

    # Check issues count
    ISSUE_COUNT=$(gh issue list --label "epic,frontend,svelte,migration,high-priority" --json number | jq length)
    ISSUE_COUNT_INFRA=$(gh issue list --label "infrastructure,ci-cd,build,production,high-priority" --json number | jq length)
    ISSUE_COUNT_SEC=$(gh issue list --label "security,secrets,compliance,critical,infrastructure" --json number | jq length)

    echo -e "${GREEN}✅ Issues created:${NC}"
    echo "   • Svelte 5 Migration: $ISSUE_COUNT"
    echo "   • Build & CI/CD: $ISSUE_COUNT_INFRA"
    echo "   • Security: $ISSUE_COUNT_SEC"

    # Show recent issues
    echo -e "${BLUE}📋 Recent Issues:${NC}"
    gh issue list --limit 5
}

# Main execution
main() {
    echo -e "${BLUE}🎯 GitHub Automation Menu:${NC}"
    echo "1. Create Pull Request"
    echo "2. Create All Issues"
    echo "3. Create Individual Issues"
    echo "4. Show Manual Setup Steps"
    echo "5. Verify Setup"
    echo "6. Complete Automation (All Steps)"
    echo ""

    read -p "Select option (1-6): " choice

    case $choice in
        1)
            create_pull_request
            ;;
        2)
            create_issue_svelte5
            create_issue_cicd
            create_issue_security
            ;;
        3)
            echo "Select issue to create:"
            echo "a) Svelte 5 Migration"
            echo "b) Build & CI/CD"
            echo "c) Security & Secrets"
            read -p "Choice (a/b/c): " issue_choice
            case $issue_choice in
                a) create_issue_svelte5 ;;
                b) create_issue_cicd ;;
                c) create_issue_security ;;
                *) echo "Invalid choice" ;;
            esac
            ;;
        4)
            show_manual_steps
            ;;
        5)
            verify_setup
            ;;
        6)
            echo -e "${GREEN}🚀 Running complete automation...${NC}"
            create_pull_request
            sleep 2
            create_issue_svelte5
            sleep 1
            create_issue_cicd
            sleep 1
            create_issue_security
            sleep 1
            echo ""
            echo -e "${GREEN}🎉 Automation complete!${NC}"
            show_manual_steps
            verify_setup
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "MASTER_PROJECT_CONTEXT.md" ]; then
    echo -e "${RED}❌ Please run this script from the attribution project root directory${NC}"
    exit 1
fi

# Run main function
main

echo ""
echo -e "${GREEN}🎯 GitHub automation completed!${NC}"
echo -e "${BLUE}📊 Repository: https://github.com/kik200771-oss/UnMoGrowP${NC}"
echo -e "${YELLOW}⚙️ Complete manual steps for full activation${NC}"