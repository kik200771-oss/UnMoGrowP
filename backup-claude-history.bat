@echo off
REM Скрипт для автоматического резервного копирования истории Claude Code
REM Создано: 18 октября 2025

REM Получить текущую дату и время для имени файла
set datetime=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set datetime=%datetime: =0%

REM Создать папку для бэкапов если её нет
if not exist "C:\КОДИНГ\claude-backups" mkdir "C:\КОДИНГ\claude-backups"

REM Скопировать историю с timestamp
copy "C:\Users\User\.claude\history.jsonl" "C:\КОДИНГ\claude-backups\history_%datetime%.jsonl"

REM Оставить только последние 10 бэкапов (удалить старые)
for /f "skip=10 delims=" %%i in ('dir /b /o-d "C:\КОДИНГ\claude-backups\history_*.jsonl"') do del "C:\КОДИНГ\claude-backups\%%i"

echo Backup completed: history_%datetime%.jsonl
