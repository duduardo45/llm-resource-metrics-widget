# Strata floating monitor

A tiny floating Strata monitor for Hyprland/Omarchy, opened from the bar.

There are two layouts:

- **Normal**: the real Strata Monitor page in a compact floating window, scaled
  and forced to a 4-column metrics grid (8 graphs visible). Decode is green and
  prefill is blue in the speed card, matching the mini layout.
- **Mini**: a custom one-graph dashboard with the model state, progress bar,
  and left/right arrows. It polls the same Strata `/metrics` endpoint. The
  Speed graph shows Decode (green) and Prefill (blue) together, like the
  normal Strata speed card.

Double-click either floating window (away from its buttons) to switch between
the normal and mini layouts. When the mini window is closed, its bar entry
shows the selected graph's current value (no label); the graph selection and
current value are kept in sync with the bar.

## Requirements

- Hyprland (the script uses the Lua dispatcher API, e.g.
  `hl.dsp.window.pin(...)`)
- Omarchy shell for the bar modules (or adapt the commands for another bar)
- `chromium`, `jq`, `curl`, `python3`

## Install

```bash
./install.sh
```

This creates:

- `~/.local/bin/strata-monitor` and `~/.local/bin/strata-monitor-ctl`
  (symlinks into this repo)
- `~/.config/strata-monitor/config.json` (created from
  `config/config.example.json` if missing)
- `~/.config/hypr/strata.lua` (symlink) and requires it from
  `~/.config/hypr/hyprland.lua`
- two command modules in `~/.config/omarchy/shell.json`

Then put the Strata API key in the config:

```json
{
  "apiKey": "your-key"
}
```

## Usage

```bash
strata-monitor open          # normal layout, or bring it to the current workspace
strata-monitor toggle        # open/close
strata-monitor pin           # pin/unpin across workspaces
strata-monitor close

strata-monitor --mini open   # mini layout
strata-monitor --mini toggle
strata-monitor --mini pin
strata-monitor --mini close

strata-monitor reload        # reload the current layout after a config change
strata-monitor switch        # normal <-> mini
strata-monitor ctl-stop      # stop the local double-click server
```

Bar modules (right side, next to the display widget):

- **Chart icon** — normal layout
- **Minimize icon** — mini layout

For either module:

- left click: toggle open/close
- right click: pin/unpin
- middle click: close

The mini window also supports `←`/`→` and the mouse wheel to change graphs.
While the mini window is closed, its bar entry shows the selected value, e.g.
`100%`, `61 °C`, or `19.1 t/s`, without the graph label.

## Configuration

`~/.config/strata-monitor/config.json`:

| Key | Meaning |
| --- | --- |
| `url` | Strata URL, normally `http://ai-brain:8080/#monitor` |
| `apiKey` | Bearer token sent to `/metrics` |
| `width`, `height` | Normal window size |
| `zoom` | CSS zoom for the normal page (`0.8` is a good compact value) |
| `columns` | Number of metrics columns to force in the normal page |
| `position` | `top-right`, `top-left`, `bottom-right`, or `bottom-left` |
| `margin` | Gap from the screen edge |
| `pinOnOpen` | Pin on every open; keeps the window above other windows |
| `controlPort` | Localhost port used by the double-click bridge |
| `mini.width`, `mini.height` | Mini window size |
| `mini.position`, `mini.margin` | Mini placement |
| `mini.pinOnOpen` | Pin the mini on every open |
| `mini.profileDir` | Separate Chromium profile for the mini layout |

Apply changes to an open window with `strata-monitor reload` (or close and
reopen). API-key/URL changes are detected on the next `open`/`toggle` and
relaunch automatically.

## How it works

- A Chromium app window is launched with a dedicated profile.
- A generated extension:
  - seeds `localStorage["strata.apikey"]` from the config (the web app reads
    its key from there),
  - applies the normal-layout zoom/grid override,
  - provides `mini.js`, which overlays the custom mini dashboard when the URL
    contains `?mini=1`,
  - listens for double-clicks and asks the local control server to switch.
- `strata-monitor-ctl` is a small localhost-only HTTP server started on the
  first launch. It handles `/switch` by running `strata-monitor switch` and
  stores the mini graph selection (`/graph`) so the bar can show its value.
- Hyprland is used for floating, sizing, positioning, pinning, and closing the
  windows.

The normal layout uses the real Strata page. The mini layout reads the same
`/metrics` JSON directly: `live`, `hardware`, `hardware_static`, `requests`,
and the `history` series arrays. Its Speed card renders `tok_s` in green and
`prefill_tok_s_mean` in blue, with independent sparkline scales like the
normal app. The selected graph index is stored in
`~/.local/state/strata-monitor/mini-graph` so the closed-window bar value
matches the last graph shown.

## Repo layout

```
bin/strata-monitor        # launcher, bar status, pin/switch logic
bin/strata-monitor-ctl    # localhost double-click bridge
extension/mini.html       # mini dashboard markup
extension/mini.css        # mini dashboard styling
extension/mini.js         # mini dashboard logic/polling
extension/dblclick.js     # double-click -> control server
config/config.example.json
hypr/strata.lua           # floating window rule
install.sh
```

## Troubleshooting

- **API key needed**: set `apiKey` in the config and run
  `strata-monitor reload`.
- **Double-click does nothing**: check
  `curl http://127.0.0.1:8787/health`; if it fails, run `strata-monitor open`
  once to start the control server, or check
  `~/.local/state/strata-monitor/control.log`.
- **Wrong window size/position**: edit the config and run
  `strata-monitor reload`.
- **Two browser processes**: normal and mini use separate Chromium profiles by
  design. Only one layout is open at a time when you use double-click/switch.
