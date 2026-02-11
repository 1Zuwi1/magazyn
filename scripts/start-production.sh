#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-$ROOT_DIR/backend/.env.production}"
FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-$ROOT_DIR/frontend/.env.production}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"
BACKEND_PROFILE="${BACKEND_PROFILE:-prod}"

load_env_file() {
  local env_file="$1"

  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    . "$env_file"
    set +a
  fi
}

echo "Building backend..."
(cd "$ROOT_DIR/backend" && ./mvnw clean package -DskipTests)

BACKEND_JAR="$(ls "$ROOT_DIR/backend"/target/*.jar 2>/dev/null | head -n 1)"
if [[ -z "$BACKEND_JAR" ]]; then
  echo "Nie znaleziono pliku JAR w backend/target. Sprawdź wynik budowania backendu." >&2
  exit 1
fi

echo "Building frontend..."
(cd "$ROOT_DIR/frontend" && bun install && bun run build)

echo "Starting backend..."
load_env_file "$BACKEND_ENV_FILE"
SPRING_PROFILES_ACTIVE="$BACKEND_PROFILE" java -jar "$BACKEND_JAR" &
BACKEND_PID=$!

echo "Starting frontend on port $FRONTEND_PORT..."
load_env_file "$FRONTEND_ENV_FILE"
PORT="$FRONTEND_PORT" bun run --cwd "$ROOT_DIR/frontend" start &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait "$BACKEND_PID" "$FRONTEND_PID"
