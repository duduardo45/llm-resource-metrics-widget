# Provider contract

A provider is an executable at `providers/<name>/provider.sh` (or a path passed
to `--provider`). It is deliberately small so a new resource monitor can be
added without touching `monitor-dock` or the bar adapters.

## Commands

| Command | Argument | Expected output |
| --- | --- | --- |
| `targets` | — | JSON array of `{id, label, default?}` |
| `status` | target | JSON object with at least `text` |
| `open` | target | perform the action |
| `toggle` | target | perform the action |
| `pin` | target | perform the action |
| `close` | target | perform the action |
| `reload` | target | perform the action |
| `switch` | target (optional) | perform the action |

`monitor-dock` resolves the default target from `targets`:

```json
[
  {"id": "mini", "label": "Strata mini", "default": true},
  {"id": "normal", "label": "Strata normal"}
]
```

Actions must be safe to run from a bar click. They should return promptly;
long-running work can be detached.

## Status JSON

```json
{
  "text": "19.1 t/s",
  "tooltip": "Strata mini — Speed 19.1 t/s (closed)",
  "class": "active",
  "alt": "optional",
  "percentage": 42
}
```

- `text` is required and is shown in the bar.
- `tooltip`, `class`, `alt`, `percentage` are optional.
- `class` may be a string or an array of strings. `active` is used by the
  Strata adapter to indicate pinned.
- `monitor-dock` filters out null fields and re-emits the object as one line of
  JSON.

If the provider is missing or returns invalid JSON, `monitor-dock status` emits
a safe error state:

```json
{"text":"!","tooltip":"monitor provider 'name' unavailable","class":"error"}
```

## Minimal template

```bash
#!/usr/bin/env bash
set -euo pipefail

cmd="${1:-status}"
target="${2:-default}"

case "$cmd" in
  targets)
    jq -cn '[{id:"default", label:"My monitor", default:true}]'
    ;;
  status)
    # Replace with your data source.
    jq -cn '{text:"42%", tooltip:"My monitor", class:""}'
    ;;
  open|toggle|pin|close|reload|switch)
    # Replace with your window/action integration.
    exit 0
    ;;
  *)
    echo "my monitor: unknown command: $cmd" >&2
    exit 2
    ;;
esac
```

See [`example/provider.sh`](example/provider.sh) for a runnable reference:

```bash
monitor-dock status --provider example
monitor-dock targets --provider example
```

## Adding a provider to a bar

Only the `--provider` value changes:

```jsonc
"exec": "~/.local/bin/monitor-dock status --provider my-monitor",
"on-click": "~/.local/bin/monitor-dock toggle --provider my-monitor"
```

The Omarchy and Waybar adapters are otherwise identical.
