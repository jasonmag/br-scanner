#!/bin/sh
set -eu

python3 -m uvicorn decoder_service.app.main:app --host 127.0.0.1 --port "${DECODER_PORT:-8000}" &
decoder_pid=$!

cleanup() {
  kill "$decoder_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

npm run start
