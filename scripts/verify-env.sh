#!/bin/sh
set -eu

: "${PORT:=3000}"
: "${NEXT_PUBLIC_APP_NAME:=Barcode Scanner}"

echo "Environment looks valid for ${NEXT_PUBLIC_APP_NAME} on port ${PORT}."
