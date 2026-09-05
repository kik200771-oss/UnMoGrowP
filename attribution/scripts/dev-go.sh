#!/bin/bash

# UnMoGrowP Attribution Platform - Go Hot Reload Script
# Uses 'air' for automatic recompilation on file changes

echo "🔥 Go Backend Hot Reload"
echo "========================"
echo ""

# Check if air is installed
if ! command -v air &> /dev/null; then
    echo "📦 Installing air for hot reload..."
    go install github.com/cosmtrek/air@latest
    echo "✅ air installed!"
    echo ""
fi

# Check if .air.toml exists
if [ ! -f "backend/.air.toml" ]; then
    echo "📝 Creating .air.toml configuration..."
    cat > backend/.air.toml << 'EOF'
root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  args_bin = []
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ./cmd/ingestion"
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  exclude_unchanged = false
  follow_symlink = false
  full_bin = ""
  include_dir = []
  include_ext = ["go", "tpl", "tmpl", "html"]
  include_file = []
  kill_delay = "0s"
  log = "build-errors.log"
  poll = false
  poll_interval = 0
  rerun = false
  rerun_delay = 500
  send_interrupt = false
  stop_on_error = false

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"

[log]
  main_only = false
  time = false

[misc]
  clean_on_exit = false

[screen]
  clear_on_rebuild = false
  keep_scroll = true
EOF
    echo "✅ .air.toml created!"
    echo ""
fi

# Start air
echo "🚀 Starting Go backend with hot reload..."
echo "   Watching: backend/**/*.go"
echo "   Port: 8080"
echo ""
cd backend && air
