# Omarchy bar integration

The live bar layout is `~/.config/omarchy/shell.json`. It is user config and is
not tracked here. `install.sh` adds the module below to
`bar.layout.right`, just before `omarchy.monitor`.

```json
{
  "id": "strata-monitor-mini",
  "type": "command",
  "exec": "~/.local/bin/strata-monitor --mini status",
  "interval": 2,
  "tooltip": "Strata mini",
  "onClick": "~/.local/bin/strata-monitor --mini toggle",
  "onRightClick": "~/.local/bin/strata-monitor --mini pin",
  "onMiddleClick": "~/.local/bin/strata-monitor --mini close"
}
```

Only the mini module is installed. The normal (4-column) layout is opened by
double-clicking the mini window, by double-clicking the mini bar value while
the window is open, or with `strata-monitor open`. Double-clicking the normal
window switches back to the mini.

This is the Omarchy (Quickshell) bar, not Waybar.
