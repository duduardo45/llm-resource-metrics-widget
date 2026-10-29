#!/usr/bin/env bash
# Contract smoke tests. They do not open windows or touch the bar.
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DOCK="$ROOT/bin/monitor-dock"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

echo "== providers =="
providers=$("$DOCK" providers)
grep -qx example <<<"$providers" || fail "example provider missing"
grep -qx strata <<<"$providers" || fail "strata provider missing"

echo "== example status =="
status=$("$DOCK" status --provider example)
printf '%s' "$status" | jq -e '.text == "example"' >/dev/null || fail "example status shape"
printf '%s' "$status" | jq -e 'has("tooltip")' >/dev/null || fail "example tooltip missing"

echo "== strata targets =="
targets=$("$DOCK" targets --provider strata)
printf '%s' "$targets" | jq -e 'map(.id) | index("mini") != null' >/dev/null || fail "mini target missing"
printf '%s' "$targets" | jq -e 'map(.id) | index("normal") != null' >/dev/null || fail "normal target missing"

echo "== strata status normal =="
status=$("$DOCK" status --provider strata --target normal)
printf '%s' "$status" | jq -e 'has("text")' >/dev/null || fail "normal status shape"

echo "== default target resolution =="
status=$("$DOCK" status --provider example)
printf '%s' "$status" | jq -e '.text == "example"' >/dev/null || fail "default target"

echo "ok"
