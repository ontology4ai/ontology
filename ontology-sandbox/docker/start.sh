#!/usr/bin/env sh
set -eu

mkdir -p /home/coder/code_gen/logs

/usr/local/bin/python3.12 /home/coder/code_gen/app.py >>/home/coder/code_gen/logs/sandbox-api.log 2>&1 &

exec /usr/bin/entrypoint.sh \
  --bind-addr 0.0.0.0:8080 \
  --proxy-domain="*" \
  --abs-proxy-base-path "${PROXY_BASE_PATH:-/code}" \
  /home/coder/code_gen
