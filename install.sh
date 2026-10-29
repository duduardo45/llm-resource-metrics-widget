#!/usr/bin/env bash
# Install the floating Strata monitor for the current user.
set -euo pipefail

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BIN_DIR="$HOME/.local/bin"
CONFIG_DIR="$HOME/.config/strata-monitor"
CONFIG="$CONFIG_DIR/config.json"
HYPR_DIR="$HOME/.config/hypr"
SHELL_JSON="$HOME/.config/omarchy/shell.json"

mkdir -p "$BIN_DIR" "$CONFIG_DIR" "${XDG_STATE_HOME:-$HOME/.local/state}/strata-monitor"
chmod +x "$REPO/bin/strata-monitor" "$REPO/bin/strata-monitor-ctl"
chmod 700 "$CONFIG_DIR" "${XDG_STATE_HOME:-$HOME/.local/state}/strata-monitor" 2>/dev/null || true

ln -sfn "$REPO/bin/strata-monitor" "$BIN_DIR/strata-monitor"
ln -sfn "$REPO/bin/strata-monitor-ctl" "$BIN_DIR/strata-monitor-ctl"

if [[ -f "$CONFIG" ]]; then
  tmp=$(mktemp)
  jq --slurpfile example "$REPO/config/config.example.json" '
    .controlPort //= $example[0].controlPort |
    .mini //= $example[0].mini
  ' "$CONFIG" > "$tmp"
  mv "$tmp" "$CONFIG"
else
  cp "$REPO/config/config.example.json" "$CONFIG"
fi
chmod 600 "$CONFIG"

if [[ -d "$HYPR_DIR" ]]; then
  ln -sfn "$REPO/hypr/strata.lua" "$HYPR_DIR/strata.lua"
  python3 - "$HYPR_DIR/hyprland.lua" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
if not path.exists():
    sys.exit(0)
text = path.read_text()
if 'require("hypr.strata")' not in text:
    anchor = 'require("hypr.autostart")'
    if anchor in text:
        text = text.replace(anchor, anchor + '\nrequire("hypr.strata")')
    else:
        text = text.rstrip() + '\nrequire("hypr.strata")\n'
    path.write_text(text)
    print("added require(\"hypr.strata\") to hyprland.lua")
PY
  if command -v hyprctl >/dev/null 2>&1; then
    hyprctl reload >/dev/null 2>&1 || true
    if errors=$(hyprctl configerrors 2>&1); then
      [[ -n "$errors" ]] && printf '%s\n' "$errors"
    fi
  fi
fi

if [[ -f "$SHELL_JSON" ]]; then
  python3 - "$SHELL_JSON" <<'PY'
import json, pathlib, sys

path = pathlib.Path(sys.argv[1])
data = json.loads(path.read_text())
bar = data.setdefault("bar", {})
layout = bar.setdefault("layout", {})
right = layout.setdefault("right", [])

def module(ident, icon_label, extra):
    return {
        "id": ident,
        "type": "command",
        "exec": f"~/.local/bin/strata-monitor{extra} status",
        "interval": 2,
        "tooltip": icon_label,
        "onClick": f"~/.local/bin/strata-monitor{extra} toggle",
        "onRightClick": f"~/.local/bin/strata-monitor{extra} pin",
        "onMiddleClick": f"~/.local/bin/strata-monitor{extra} close",
    }

entries = [
    module("strata-monitor-mini", "Strata mini", " --mini"),
]
# Remove the old normal-layout icon too. The normal layout is reached by
# double-clicking the mini window (or `strata-monitor open`).
remove_ids = {"strata-monitor", "strata-monitor-mini"}
right = [item for item in right if not (isinstance(item, dict) and item.get("id") in remove_ids)]
index = next((i for i, item in enumerate(right) if isinstance(item, dict) and item.get("id") == "omarchy.monitor"), len(right))
right[index:index] = entries
layout["right"] = right
path.write_text(json.dumps(data, indent=2) + "\n")
print("updated the Omarchy bar modules")
PY
fi

cat <<EOF
Installed the floating Strata monitor.

  config: $CONFIG
  binary: $BIN_DIR/strata-monitor

Set "apiKey" in the config, then open it from the bar or with:
  strata-monitor --mini open
  strata-monitor open        # normal layout

The bar has only the mini module. Double-click the mini window to switch to
the normal layout, and double-click the normal window to switch back.
EOF
