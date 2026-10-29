# Strata floating monitor

A floating monitor dock for Hyprland with a provider layer and thin bar
adapters. Strata is the first provider; the same application and bar adapters
can drive other resource monitors without changing the bar configuration.

## Layers

```
src/presentation/bars/{omarchy,waybar}   presentation adapters
                 │
src/presentation/cli/monitor-dock        application entry point
                 │
src/core/providers (contract)             core boundary
                 │
src/infrastructure/providers/<name>       provider adapters
                 │
src/infrastructure/providers/strata/      Strata use cases + engine
                 │
   Hyprland | Chromium | Strata           external systems

src/core/graphs/*.js                     one class per graph
                 │
src/presentation/mini/*.js               Sparkline / StateView / MiniView
```

- `src/presentation/cli/monitor-dock` knows only the provider contract and
  normalized JSON.
- `src/infrastructure/providers/<name>/provider.sh` is the adapter for one
  monitor.
- `src/infrastructure/providers/strata/engine.sh` contains the Strata use
  cases and the Hyprland/Chromium infrastructure calls.
- `src/presentation/bars/` holds the Omarchy and Waybar adapters.
- `src/core/graphs/` has one class per graph; the mini UI and the closed-bar
  value both use them.

See [`docs/architecture.md`](docs/architecture.md) and
[`src/core/providers/README.md`](src/core/providers/README.md).

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
- `chromium`, `jq`, `curl`, `python3`, `node`

## Install

```bash
./install.sh
```

This creates:

- `~/.local/bin/monitor-dock` (application entry point)
- `~/.local/bin/strata-monitor` (compatibility wrapper)
- `~/.local/bin/strata-monitor-ctl` (localhost control server)
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
[`src/presentation/bars/waybar/`](src/presentation/bars/waybar/) into `~/.config/waybar/` as described there.

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
[`src/presentation/bars/omarchy/module.json`](src/presentation/bars/omarchy/module.json) into
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
[`src/presentation/bars/waybar/config.jsonc`](src/presentation/bars/waybar/config.jsonc) into
`~/.config/waybar/config.jsonc`, add `"custom/strata-mini"` to
`modules-right`, and optionally copy
[`src/presentation/bars/waybar/style.css`](src/presentation/bars/waybar/style.css) into
`~/.config/waybar/style.css`.

Waybar uses the same JSON:

```json
{"text":"19.1 t/s","tooltip":"Strata mini — Speed 19.1 t/s (closed)","class":""}
```

`text`, `tooltip`, `class`, `alt`, and `percentage` are supported by the
normalized status shape. Waybar applies `class` to the widget, so
`#custom-strata-mini.active` highlights the pinned state.

## Provider contract

A provider is `src/infrastructure/providers/<name>/provider.sh` with these subcommands:

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
[`src/infrastructure/providers/example/provider.sh`](src/infrastructure/providers/example/provider.sh). To add a new
resource monitor, copy that directory:

```bash
mkdir -p providers/my-monitor
mkdir -p src/infrastructure/providers/my-monitor
cp src/infrastructure/providers/example/provider.sh src/infrastructure/providers/my-monitor/provider.sh
$EDITOR src/infrastructure/providers/my-monitor/provider.sh
monitor-dock status --provider my-monitor
```

Then point the bar adapter at `--provider my-monitor`. Neither the application
nor the bar adapter needs to change. See [`src/core/providers/README.md`](src/core/providers/README.md).

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
- `src/infrastructure/providers/strata/provider.sh` maps the contract to the Strata engine.
- The engine launches a Chromium app window with a dedicated profile. For the
  normal layout, a generated extension seeds the API key, applies the
  zoom/grid overrides, and handles double-click. The mini layout is a local
  page served by the control server.
- `src/infrastructure/control/strata-monitor-ctl` serves the mini presentation
  layer and `/src/...` modules, proxies `/metrics` with the API key, handles
  double-click switching, and stores the selected graph index.
- The mini UI is native ES modules: `MiniView` + `StateView` + `Sparkline`
  render `src/core/graphs/*` classes. There is one class per graph.
- The closed mini bar value is formatted by
  `src/infrastructure/providers/strata/graph-value.js`, which imports the same graph classes.
- Hyprland handles floating, sizing, positioning, pinning, and closing.
- The Hyprland rule uses `opacity = "1 override 1 override"` and
  `no_dim = true`, so the global `inactive_opacity`/`dim_inactive` looknfeel
  settings do not make these windows translucent. The looknfeel itself is
  untouched.

## Repo layout

```
src/core/
  format.js                       # number/GB formatting
  graphs/                         # one class per graph
    graph.js
    speed-graph.js
    gpu-load-graph.js
    vram-graph.js
    gpu-temp-graph.js
    power-graph.js
    pcie-graph.js
    cpu-graph.js
    disk-read-graph.js
    index.js                      # ordered graph registry
  providers/README.md             # provider contract
src/presentation/
  cli/monitor-dock                # application layer, bar-agnostic
  cli/strata-monitor              # compatibility wrapper
  mini/                           # index.html, css, view modules
  bars/omarchy/module.json        # Omarchy bar snippet
  bars/waybar/                    # Waybar config/style snippets
  bars/README.md
src/infrastructure/
  providers/strata/provider.sh    # Strata provider adapter
  providers/strata/engine.sh      # Strata use cases + infrastructure
  providers/strata/graph-value.js # shared graph formatter for the bar
  providers/example/provider.sh   # annotated provider template
  control/strata-monitor-ctl      # localhost server / metrics proxy
  chromium/content/dblclick.js    # normal-page content script
  hyprland/strata.lua             # floating/opacity window rules
config/config.example.json
docs/architecture.md
tests/test-monitor-dock.sh
install.sh
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
