#!/usr/bin/env bash
# Strata provider adapter.
#
# This is the only file that knows Strata-specific details. The engine contains
# the Strata use cases and infrastructure calls; monitor-dock and the bar
# adapters only speak the provider contract.
set -euo pipefail

HERE=$(cd "$(dirname "$(readlink -f "$0")")" && pwd)
ENGINE="${STRATA_MONITOR_ENGINE:-$HERE/engine.sh}"

cmd="${1:-status}"
target="${2:-mini}"

case "$cmd" in
  targets)
    jq -cn '[
      {id:"normal", label:"Strata normal"},
      {id:"mini", label:"Strata mini", default:true}
    ]'
    ;;
  status|open|toggle|pin|close|reload)
    case "$target" in
      mini)
        exec "$ENGINE" --mini "$cmd"
        ;;
      normal|max)
        exec "$ENGINE" "$cmd"
        ;;
      *)
        echo "strata provider: unknown target: $target" >&2
        exit 2
        ;;
    esac
    ;;
  switch)
    exec "$ENGINE" switch
    ;;
  ctl-stop)
    exec "$ENGINE" ctl-stop
    ;;
  *)
    echo "strata provider: unknown command: $cmd" >&2
    exit 2
    ;;
esac
