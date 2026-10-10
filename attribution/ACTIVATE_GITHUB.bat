@echo off
echo 🚀 UnMoGrowP GitHub Activation
echo ===============================

echo.
echo Option 1: Automatic with GitHub Token
echo --------------------------------------
echo 1. Go to: https://github.com/settings/tokens
echo 2. Create token with repo permissions
echo 3. Run: powershell -ExecutionPolicy Bypass -File scripts\github-api-automation.ps1 -Token "your_token"

echo.
echo Option 2: Manual Web Interface
echo ------------------------------
echo Opening GitHub pages for manual setup...

start https://github.com/kik200771-oss/UnMoGrowP/compare/main...feature/migrate-to-svelte
timeout /t 2 /nobreak >nul

start https://github.com/kik200771-oss/UnMoGrowP/issues/new/choose
timeout /t 2 /nobreak >nul

start https://github.com/kik200771-oss/UnMoGrowP/settings/branches
timeout /t 2 /nobreak >nul

start https://github.com/kik200771-oss/UnMoGrowP/settings
timeout /t 2 /nobreak >nul

echo.
echo 📋 Manual Setup Instructions:
echo =============================
echo.
echo 1. CREATE PULL REQUEST:
echo    Title: 🚀 Engineering Process Implementation ^& Platform Development Consolidation
echo    Description: Copy from PR_DESCRIPTION.md
echo.
echo 2. CREATE 3 ISSUES:
echo    - Copy content from github-issues\issue-svelte5-migration.md
echo    - Copy content from github-issues\issue-build-cicd.md
echo    - Copy content from github-issues\issue-security-secrets.md
echo.
echo 3. BRANCH PROTECTION:
echo    - Add rule for 'main' branch
echo    - Require 2 PR approvals
echo    - Require CODEOWNERS review
echo.
echo 4. REPOSITORY SETTINGS:
echo    - Enable Issues, Projects, Wiki, Discussions
echo    - Enable all Security features
echo.
echo ✅ All GitHub pages opened in browser!
echo 📁 All content files ready in project directory
echo.
pause