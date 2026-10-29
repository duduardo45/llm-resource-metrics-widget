#!/usr/bin/env bash
# Example provider: a tiny reference implementation of the provider contract.
# Copy this directory to providers/<your-monitor>/ and replace the status/action
# bodies. monitor-dock and every bar adapter will work unchanged.
set -euo pipefail

cmd="${1:-status}"
target="${2:-demo}"

case "$cmd" in
  targets)
    jq -cn '[{id:"demo", label:"Example monitor", default:true}]'
    ;;
  status)
    # Waybar/Omarchy-compatible status shape.
    jq -cn --arg t "Example provider" \
      '{text:"example", tooltip:$t, class:""}'
    ;;
  open|toggle|pin|close|reload|switch)
    # Replace with your monitor's action.
    exit 0
    ;;
  *)
    echo "example provider: unknown command: $cmd" >&2
    exit 2
    ;;
esac
