#!/bin/sh
set -eu

wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" >/dev/null
