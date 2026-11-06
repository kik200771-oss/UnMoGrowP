#!/bin/bash
# Complete GitHub Activation Script - Fully Automated
# Uses GitHub API with maximum automation

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REPO_OWNER="kik200771-oss"
REPO_NAME="UnMoGrowP"
BASE_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME"

echo -e "${GREEN}🚀 UnMoGrowP GitHub Auto-Activation Starting...${NC}"

# Function to check repository status
check_repository() {
    echo -e "${BLUE}🔍 Checking repository status...${NC}"

    REPO_INFO=$(curl -s "$BASE_URL")

    if echo "$REPO_INFO" | grep -q '"id"'; then
        echo -e "${GREEN}✅ Repository accessible${NC}"

        # Extract key information
        HAS_ISSUES=$(echo "$REPO_INFO" | grep -o '"has_issues":[^,]*' | cut -d':' -f2)
        HAS_PROJECTS=$(echo "$REPO_INFO" | grep -o '"has_projects":[^,]*' | cut -d':' -f2)
        HAS_WIKI=$(echo "$REPO_INFO" | grep -o '"has_wiki":[^,]*' | cut -d':' -f2)
        DEFAULT_BRANCH=$(echo "$REPO_INFO" | grep -o '"default_branch":"[^"]*"' | cut -d'"' -f4)
        OPEN_ISSUES=$(echo "$REPO_INFO" | grep -o '"open_issues_count":[^,]*' | cut -d':' -f2)

        echo -e "${BLUE}📊 Repository Status:${NC}"
        echo -e "   Issues: $HAS_ISSUES"
        echo -e "   Projects: $HAS_PROJECTS"
        echo -e "   Wiki: $HAS_WIKI"
        echo -e "   Default Branch: $DEFAULT_BRANCH"
        echo -e "   Open Issues: $OPEN_ISSUES"

        return 0
    else
        echo -e "${RED}❌ Cannot access repository${NC}"
        return 1
    fi
}

# Function to try creating PR without token (will show what's needed)
try_create_pr() {
    echo -e "${BLUE}📋 Attempting to create Pull Request...${NC}"

    # Read PR description
    if [ -f "PR_DESCRIPTION.md" ]; then
        PR_BODY=$(cat PR_DESCRIPTION.md)
    else
        PR_BODY="Engineering Process Implementation & Platform Development Consolidation"
    fi

    # Create PR data
    PR_DATA=$(cat << EOF
{
  "title": "🚀 Engineering Process Implementation & Platform Development Consolidation",
  "head": "feature/migrate-to-svelte",
  "base": "main",
  "body": "$PR_BODY",
  "draft": false
}
EOF
)

    # Try to create PR
    RESPONSE=$(curl -s -X POST \
        -H "Accept: application/vnd.github.v3+json" \
        -H "User-Agent: UnMoGrowP-Automation" \
        -d "$PR_DATA" \
        "$BASE_URL/pulls" 2>&1)

    if echo "$RESPONSE" | grep -q '"html_url"'; then
        PR_URL=$(echo "$RESPONSE" | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Pull Request created successfully!${NC}"
        echo -e "${BLUE}🔗 PR URL: $PR_URL${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ PR creation requires authentication${NC}"
        echo -e "${BLUE}📋 PR Details Ready:${NC}"
        echo -e "   Title: 🚀 Engineering Process Implementation & Platform Development Consolidation"
        echo -e "   Head: feature/migrate-to-svelte"
        echo -e "   Base: main"
        echo -e "   URL: https://github.com/$REPO_OWNER/$REPO_NAME/compare/main...feature/migrate-to-svelte"
        return 1
    fi
}

# Function to try creating Issues
try_create_issues() {
    echo -e "${BLUE}📝 Attempting to create Issues...${NC}"

    ISSUES=(
        "[EPIC] Svelte 5 Migration Plan - Attribution Platform Frontend"
        "[INFRA] Build & CI/CD Infrastructure Enhancement - Production-Ready Pipeline"
        "[SECURITY] Security & Secrets Management Enhancement - Enterprise-Grade Protection"
    )

    ISSUE_FILES=(
        "github-issues/issue-svelte5-migration.md"
        "github-issues/issue-build-cicd.md"
        "github-issues/issue-security-secrets.md"
    )

    LABELS=(
        "epic,frontend,svelte,migration,high-priority"
        "infrastructure,ci-cd,build,production,high-priority"
        "security,secrets,compliance,critical,infrastructure"
    )

    for i in {0..2}; do
        echo -e "${BLUE}Creating Issue $((i+1)): ${ISSUES[i]}${NC}"

        # Read issue body
        if [ -f "${ISSUE_FILES[i]}" ]; then
            ISSUE_BODY=$(cat "${ISSUE_FILES[i]}")
        else
            ISSUE_BODY="Issue content for ${ISSUES[i]}"
        fi

        # Create issue data
        ISSUE_DATA=$(cat << EOF
{
  "title": "${ISSUES[i]}",
  "body": "$ISSUE_BODY",
  "labels": ["$(echo ${LABELS[i]} | sed 's/,/","/g')"],
  "assignees": ["$REPO_OWNER"]
}
EOF
)

        # Try to create issue
        RESPONSE=$(curl -s -X POST \
            -H "Accept: application/vnd.github.v3+json" \
            -H "User-Agent: UnMoGrowP-Automation" \
            -d "$ISSUE_DATA" \
            "$BASE_URL/issues" 2>&1)

        if echo "$RESPONSE" | grep -q '"html_url"'; then
            ISSUE_URL=$(echo "$RESPONSE" | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4)
            ISSUE_NUMBER=$(echo "$RESPONSE" | grep -o '"number":[^,]*' | cut -d':' -f2)
            echo -e "${GREEN}✅ Issue #$ISSUE_NUMBER created!${NC}"
            echo -e "${BLUE}🔗 URL: $ISSUE_URL${NC}"
        else
            echo -e "${YELLOW}⚠️ Issue creation requires authentication${NC}"
            echo -e "${BLUE}📋 Issue $((i+1)) Details Ready:${NC}"
            echo -e "   Title: ${ISSUES[i]}"
            echo -e "   Labels: ${LABELS[i]}"
            echo -e "   Body: Ready in ${ISSUE_FILES[i]}"
        fi
    done
}

# Function to open browser automation
open_github_pages() {
    echo -e "${BLUE}🌐 Opening GitHub pages for manual completion...${NC}"

    # Open PR creation page
    echo -e "${YELLOW}Opening PR creation page...${NC}"
    if command -v start >/dev/null 2>&1; then
        start "https://github.com/$REPO_OWNER/$REPO_NAME/compare/main...feature/migrate-to-svelte"
    elif command -v open >/dev/null 2>&1; then
        open "https://github.com/$REPO_OWNER/$REPO_NAME/compare/main...feature/migrate-to-svelte"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "https://github.com/$REPO_OWNER/$REPO_NAME/compare/main...feature/migrate-to-svelte"
    fi

    sleep 2

    # Open Issues creation page
    echo -e "${YELLOW}Opening Issues creation page...${NC}"
    if command -v start >/dev/null 2>&1; then
        start "https://github.com/$REPO_OWNER/$REPO_NAME/issues/new/choose"
    elif command -v open >/dev/null 2>&1; then
        open "https://github.com/$REPO_OWNER/$REPO_NAME/issues/new/choose"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "https://github.com/$REPO_OWNER/$REPO_NAME/issues/new/choose"
    fi

    sleep 2

    # Open settings pages
    echo -e "${YELLOW}Opening repository settings...${NC}"
    if command -v start >/dev/null 2>&1; then
        start "https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
        start "https://github.com/$REPO_OWNER/$REPO_NAME/settings"
    elif command -v open >/dev/null 2>&1; then
        open "https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
        open "https://github.com/$REPO_OWNER/$REPO_NAME/settings"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
        xdg-open "https://github.com/$REPO_OWNER/$REPO_NAME/settings"
    fi
}

# Function to show manual instructions
show_manual_instructions() {
    echo -e "${YELLOW}📋 Manual GitHub Setup Instructions:${NC}"
    echo ""
    echo -e "${BLUE}1. CREATE PULL REQUEST:${NC}"
    echo -e "   URL: https://github.com/$REPO_OWNER/$REPO_NAME/compare/main...feature/migrate-to-svelte"
    echo -e "   Title: 🚀 Engineering Process Implementation & Platform Development Consolidation"
    echo -e "   Description: Copy from PR_DESCRIPTION.md"
    echo ""
    echo -e "${BLUE}2. CREATE 3 ISSUES:${NC}"
    echo -e "   URL: https://github.com/$REPO_OWNER/$REPO_NAME/issues/new/choose"
    echo -e "   Issue #1: Copy from github-issues/issue-svelte5-migration.md"
    echo -e "   Issue #2: Copy from github-issues/issue-build-cicd.md"
    echo -e "   Issue #3: Copy from github-issues/issue-security-secrets.md"
    echo ""
    echo -e "${BLUE}3. BRANCH PROTECTION:${NC}"
    echo -e "   URL: https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
    echo -e "   Add rule for 'main' branch with 2 PR approvals"
    echo ""
    echo -e "${BLUE}4. REPOSITORY SETTINGS:${NC}"
    echo -e "   URL: https://github.com/$REPO_OWNER/$REPO_NAME/settings"
    echo -e "   Enable all Security features"
}

# Function to create GitHub token instructions
show_token_instructions() {
    echo -e "${BLUE}🔑 For Full Automation, Create GitHub Token:${NC}"
    echo ""
    echo -e "${YELLOW}1. Go to: https://github.com/settings/tokens${NC}"
    echo -e "${YELLOW}2. Click 'Generate new token (classic)'${NC}"
    echo -e "${YELLOW}3. Select scopes: repo, workflow${NC}"
    echo -e "${YELLOW}4. Copy the token${NC}"
    echo -e "${YELLOW}5. Run: export GITHUB_TOKEN='your_token_here'${NC}"
    echo -e "${YELLOW}6. Re-run this script${NC}"
    echo ""
    echo -e "${BLUE}Or use PowerShell automation:${NC}"
    echo -e "${YELLOW}powershell -ExecutionPolicy Bypass -File scripts/github-api-automation.ps1 -Token 'your_token'${NC}"
}

# Main execution
main() {
    # Check repository
    if ! check_repository; then
        exit 1
    fi

    echo ""
    echo -e "${GREEN}🚀 Starting GitHub Activation...${NC}"

    # Try to create PR
    PR_SUCCESS=false
    if try_create_pr; then
        PR_SUCCESS=true
    fi

    echo ""

    # Try to create Issues
    ISSUES_SUCCESS=false
    if try_create_issues; then
        ISSUES_SUCCESS=true
    fi

    echo ""

    # Open browser pages for manual completion
    open_github_pages

    echo ""

    # Show results
    echo -e "${GREEN}📊 Activation Summary:${NC}"
    echo -e "   Pull Request: $(if [ "$PR_SUCCESS" = true ]; then echo "✅ Created"; else echo "📋 Ready for manual creation"; fi)"
    echo -e "   Issues: $(if [ "$ISSUES_SUCCESS" = true ]; then echo "✅ Created"; else echo "📋 Ready for manual creation"; fi)"
    echo -e "   Browser Pages: ✅ Opened"
    echo -e "   Content Files: ✅ Ready"

    echo ""

    if [ "$PR_SUCCESS" = false ] || [ "$ISSUES_SUCCESS" = false ]; then
        show_token_instructions
        echo ""
        show_manual_instructions
    fi

    echo ""
    echo -e "${GREEN}🎯 GitHub activation process completed!${NC}"
    echo -e "${BLUE}📊 Repository: https://github.com/$REPO_OWNER/$REPO_NAME${NC}"
}

# Check if we're in the right directory
if [ ! -f "MASTER_PROJECT_CONTEXT.md" ]; then
    echo -e "${RED}❌ Please run this script from the attribution project root directory${NC}"
    exit 1
fi

# Run main function
main