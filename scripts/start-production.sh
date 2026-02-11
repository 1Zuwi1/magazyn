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

echo "Budowanie backendu..."
(cd "$ROOT_DIR/backend" && ./mvnw clean package -DskipTests)

BACKEND_JAR="$(ls "$ROOT_DIR/backend"/target/*.jar 2>/dev/null | head -n 1)"
if [[ -z "$BACKEND_JAR" ]]; then
  echo "Nie znaleziono pliku JAR w backend/target. Sprawdź wynik budowania backendu." >&2
  exit 1
fi

echo "Budowanie frontend..."
load_env_file "$FRONTEND_ENV_FILE"
(cd "$ROOT_DIR/frontend" && bun install && bun run build)

echo "Uruchamianie backendu..."
load_env_file "$BACKEND_ENV_FILE"
SPRING_PROFILES_ACTIVE="$BACKEND_PROFILE" java -jar "$BACKEND_JAR" &
BACKEND_PID=$!

echo "Uruchamianie frontend na porcie $FRONTEND_PORT..."
cd "$ROOT_DIR/frontend"
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static

rm -rf .next/standalone/public
cp -R public .next/standalone/public
cd "$ROOT_DIR"
PORT="$FRONTEND_PORT" bun run --cwd "$ROOT_DIR/frontend" .next/standalone/server.js &
FRONTEND_PID=$!

cleanup() {
  echo "Zatrzymywanie usług..."
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait
