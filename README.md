# Strata floating monitor

A floating monitor dock for Hyprland with a provider layer and thin bar
adapters. Strata is the first provider; the same application and bar adapters
can drive other resource monitors without changing the bar configuration.

## Layers

```
bar/omarchy/   bar/waybar/        presentation adapters
        \         /
      bin/monitor-dock            application layer (bar-agnostic CLI)
              |
     providers/<name>/provider.sh provider contract
              |
   providers/strata/engine.sh     provider implementation (use cases)
              |
   Hyprland | Chromium | Strata   infrastructure / external systems
```

- `bin/monitor-dock` knows only the provider contract and normalized JSON.
- `providers/<name>/provider.sh` is the adapter for one monitor.
- `providers/strata/engine.sh` contains the Strata use cases and the
  Hyprland/Chromium infrastructure calls.
- `bar/omarchy` and `bar/waybar` are presentation adapters; they only call
  `monitor-dock`.
- `extension/` is the UI adapter used by the Strata provider's Chromium window.

See [`docs/architecture.md`](docs/architecture.md) and
[`providers/README.md`](providers/README.md).

## Layouts

The Strata provider has two targets:

- **normal** — the real Strata Monitor page in a compact floating window,
  scaled and forced to a 4-column metrics grid (8 graphs visible). Decode is
  green and prefill is blue in the speed card.
- **mini** — a custom one-graph dashboard with model state, progress bar, and
  left/right arrows. Speed shows Decode (green) and Prefill (blue) together.

Double-click either floating window (away from its buttons) to switch between
the normal and mini layouts. When the mini window is closed, its bar entry
shows the selected graph's value (no label), kept in sync with the last graph
shown.

## Requirements

- Hyprland (the engine uses the Lua dispatcher API)
- Omarchy shell or Waybar for the bar adapter
- `chromium`, `jq`, `curl`, `python3`

## Install

```bash
./install.sh
```

This creates:

- `~/.local/bin/monitor-dock` (application entry point)
- `~/.local/bin/strata-monitor` (compatibility wrapper)
- `~/.local/bin/strata-monitor-ctl` (double-click bridge)
- `~/.config/strata-monitor/config.json` from the example if missing
- `~/.config/hypr/strata.lua` and requires it from `hyprland.lua`
- the single mini module in `~/.config/omarchy/shell.json`

Then set the API key in the config:

```json
{
  "apiKey": "your-key"
}
```

Waybar is not modified automatically. Copy the snippets from
[`bar/waybar/`](bar/waybar/) into `~/.config/waybar/` as described there.

## Usage

Generic application (recommended):

```bash
monitor-dock status --provider strata --target mini
monitor-dock toggle --provider strata --target mini
monitor-dock open   --provider strata --target normal
monitor-dock pin    --provider strata --target mini
monitor-dock close  --provider strata --target mini
monitor-dock switch --provider strata
```

`monitor-dock providers` lists providers and
`monitor-dock targets --provider strata` lists targets. The default provider is
`strata`; the default target is the provider's `default: true` target.

The old `strata-monitor` CLI remains as a compatibility wrapper:

```bash
strata-monitor open
strata-monitor --mini open
strata-monitor pin
strata-monitor switch
strata-monitor ctl-stop
```

Bar controls (both adapters):

- left click: toggle the mini open/close
- right click: pin/unpin
- middle click: close

There is intentionally no separate normal-layout bar icon. Double-click the
mini window to switch to normal; double-click the normal window to switch back.
You can also use `monitor-dock open --provider strata --target normal`.

The mini window supports `←`/`→` and the mouse wheel to change graphs.

## Bar adapters

### Omarchy (Quickshell)

`install.sh` inserts
[`bar/omarchy/module.json`](bar/omarchy/module.json) into
`~/.config/omarchy/shell.json`:

```json
{
  "id": "strata-monitor-mini",
  "type": "command",
  "exec": "~/.local/bin/monitor-dock status --provider strata --target mini",
  "interval": 2,
  "tooltip": "Strata mini",
  "onClick": "~/.local/bin/monitor-dock toggle --provider strata --target mini",
  "onRightClick": "~/.local/bin/monitor-dock pin --provider strata --target mini",
  "onMiddleClick": "~/.local/bin/monitor-dock close --provider strata --target mini"
}
```

The live layout is user config and is not tracked.

### Waybar

Copy the module from
[`bar/waybar/config.jsonc`](bar/waybar/config.jsonc) into
`~/.config/waybar/config.jsonc`, add `"custom/strata-mini"` to
`modules-right`, and optionally copy
[`bar/waybar/style.css`](bar/waybar/style.css) into
`~/.config/waybar/style.css`.

Waybar uses the same JSON:

```json
{"text":"19.1 t/s","tooltip":"Strata mini — Speed 19.1 t/s (closed)","class":""}
```

`text`, `tooltip`, `class`, `alt`, and `percentage` are supported by the
normalized status shape. Waybar applies `class` to the widget, so
`#custom-strata-mini.active` highlights the pinned state.

## Provider contract

A provider is `providers/<name>/provider.sh` with these subcommands:

| Command | Output / action |
| --- | --- |
| `targets` | JSON array of `{id, label, default?}` |
| `status <target>` | JSON object with at least `text`; optional `tooltip`, `class`, `alt`, `percentage` |
| `open <target>` | open the target's window |
| `toggle <target>` | toggle it |
| `pin <target>` | toggle pin/always-on-top |
| `close <target>` | close it |
| `reload <target>` | reload it |
| `switch [target]` | switch layout/context if the provider supports it |

`monitor-dock` validates the status JSON and falls back to an error state if a
provider is unavailable. Provider-specific commands (for example
`ctl-stop`) are passed through unchanged.

An annotated reference implementation is in
[`providers/example/provider.sh`](providers/example/provider.sh). To add a new
resource monitor, copy that directory:

```bash
mkdir -p providers/my-monitor
cp providers/example/provider.sh providers/my-monitor/provider.sh
$EDITOR providers/my-monitor/provider.sh
monitor-dock status --provider my-monitor
```

Then point the bar adapter at `--provider my-monitor`. Neither the application
nor the bar adapter needs to change. See [`providers/README.md`](providers/README.md).

## Configuration

`~/.config/strata-monitor/config.json`:

| Key | Meaning |
| --- | --- |
| `url` | Strata URL, normally `http://ai-brain:8080/#monitor` |
| `apiKey` | Bearer token sent to `/metrics` |
| `width`, `height` | Normal window size |
| `zoom` | CSS zoom for the normal page |
| `columns` | Metrics columns forced in the normal page |
| `position` | `top-right`, `top-left`, `bottom-right`, or `bottom-left` |
| `margin` | Gap from the screen edge |
| `pinOnOpen` | Pin on every open; keeps the window above other windows |
| `controlPort` | Localhost port used by the double-click bridge |
| `mini.width`, `mini.height` | Mini window size |
| `mini.position`, `mini.margin` | Mini placement |
| `mini.pinOnOpen` | Pin the mini on every open |
| `mini.profileDir` | Separate Chromium profile for the mini layout |

Apply changes to an open window with
`monitor-dock reload --provider strata --target mini` (or use the
`strata-monitor` wrapper). API-key/URL changes are detected on the next
open/toggle and relaunch automatically.

## How it works

- `monitor-dock` resolves a provider and a target, then calls `status` or an
  action.
- `providers/strata/provider.sh` maps the contract to the Strata engine.
- The engine launches a Chromium app window with a dedicated profile. A
  generated extension seeds the API key, applies the normal-layout overrides,
  provides the optional-overlay mini dashboard, and handles double-click.
- `strata-monitor-ctl` is a localhost-only HTTP server used for the
  double-click bridge and the mini graph selection.
- Hyprland handles floating, sizing, positioning, pinning, and closing.
- The Hyprland rule uses `opacity = "1 override 1 override"` and
  `no_dim = true`, so the global `inactive_opacity`/`dim_inactive` looknfeel
  settings do not make these windows translucent. The looknfeel itself is
  untouched.

## Repo layout

```
bin/monitor-dock              # application layer, bar-agnostic
bin/strata-monitor            # compatibility wrapper
bin/strata-monitor-ctl        # localhost double-click bridge
providers/strata/provider.sh  # Strata provider adapter
providers/strata/engine.sh    # Strata use cases + infrastructure
providers/example/provider.sh # annotated provider template
extension/mini.html           # mini dashboard markup
extension/mini.css            # mini dashboard styling
extension/mini.js             # mini dashboard logic/polling
extension/dblclick.js         # double-click -> control server
config/config.example.json
hypr/strata.lua               # floating/opacity window rules
bar/omarchy/module.json       # Omarchy bar module snippet
bar/waybar/                   # Waybar config/style snippets
bar/README.md                 # bar adapter overview
docs/architecture.md          # layer boundaries and contract
providers/README.md           # provider contract
install.sh
tests/test-monitor-dock.sh
```

## Troubleshooting

- **API key needed**: set `apiKey` in the config and reload the mini/normal
  target.
- **Double-click does nothing**: check
  `curl http://127.0.0.1:8787/health`; run `monitor-dock open --provider strata
  --target mini` to start the control server, or inspect
  `~/.local/state/strata-monitor/control.log`.
- **Wrong window size/position**: edit the config and reload.
- **Bar shows `!`**: run
  `monitor-dock status --provider strata --target mini` manually; the tooltip
  reports an unavailable provider or invalid status.
- **Two browser processes**: normal and mini use separate Chromium profiles by
  design. Double-click/switch keeps only one layout open.
