#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/jeonsr/바탕화면/Project/X-mas"
PORT_FILE="/tmp/xmas-card-studio.port"
PID_FILE="/tmp/xmas-card-studio.pid"
BUILD_FILE="/tmp/xmas-card-studio.buildid"
LOG_FILE="/tmp/xmas-card-studio.log"

cd "$APP_DIR"

is_xmas_running() {
  local p="$1"
  local body
  body="$(curl -fsS --max-time 1 "http://127.0.0.1:${p}/api/config/status" 2>/dev/null || true)"
  [[ "$body" == *"\"email\":"* && "$body" == *"\"kakaoConfigured\":"* ]]
}

is_port_busy() {
  local p="$1"
  node -e "
    const net = require('net');
    const s = net.connect({ port: Number(process.argv[1]), host: '127.0.0.1' });
    s.on('connect', () => { s.destroy(); process.exit(0); });
    s.on('error', () => process.exit(1));
  " "$p" 2>/dev/null
}

# 1. Ensure SQLite DB and Next.js build exist
if [[ ! -f "prisma/dev.db" ]]; then
  npx prisma db push --skip-generate >> "$LOG_FILE" 2>&1
fi

if [[ ! -d ".next" ]]; then
  npm run build >> "$LOG_FILE" 2>&1
fi

CURRENT_BUILD_ID="$(cat .next/BUILD_ID 2>/dev/null || echo 'unknown')"
RUNNING_BUILD_ID="$(cat "$BUILD_FILE" 2>/dev/null || true)"

# 2. Reuse running instance ONLY if build matches; otherwise stop stale server
if [[ -f "$PORT_FILE" ]]; then
  SAVED_PORT="$(cat "$PORT_FILE" 2>/dev/null || true)"
  if [[ -n "$SAVED_PORT" ]] && is_xmas_running "$SAVED_PORT"; then
    if [[ "$CURRENT_BUILD_ID" == "$RUNNING_BUILD_ID" ]]; then
      xdg-open "http://localhost:${SAVED_PORT}" >/dev/null 2>&1 &
      exit 0
    else
      if [[ -f "$PID_FILE" ]]; then
        OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
        [[ -n "$OLD_PID" ]] && kill "$OLD_PID" 2>/dev/null || true
      fi
      pkill -f "[n]ext-server" 2>/dev/null || true
      sleep 0.5
    fi
  fi
fi

if is_xmas_running 3000; then
  if [[ "$CURRENT_BUILD_ID" == "$RUNNING_BUILD_ID" ]]; then
    echo "3000" > "$PORT_FILE"
    xdg-open "http://localhost:3000" >/dev/null 2>&1 &
    exit 0
  else
    pkill -f "[n]ext start -p 3000" 2>/dev/null || true
    pkill -f "[n]ext-server" 2>/dev/null || true
    sleep 0.5
  fi
fi

# 3. Pick an available port (prefer 3000, fallback 3025..3035)
PORT=""
for candidate in 3000 3025 3026 3027 3028 3029 3030 3031 3032 3033 3034 3035; do
  if ! is_port_busy "$candidate"; then
    PORT="$candidate"
    break
  fi
done

if [[ -z "$PORT" ]]; then
  PORT=3025
fi

# 4. Launch production server in background
nohup npx next start -p "$PORT" > "$LOG_FILE" 2>&1 < /dev/null &
echo "$!" > "$PID_FILE"
echo "$PORT" > "$PORT_FILE"
echo "$CURRENT_BUILD_ID" > "$BUILD_FILE"

# 5. Wait until server is ready, then open browser
for _ in $(seq 1 40); do
  if is_xmas_running "$PORT"; then
    break
  fi
  sleep 0.3
done

xdg-open "http://localhost:${PORT}" >/dev/null 2>&1 &
