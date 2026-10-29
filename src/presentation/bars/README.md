# Bar adapters

The application layer is `src/presentation/cli/monitor-dock`; bar adapters are intentionally
thin and only know the provider contract.

| Bar | Adapter | Installation |
| --- | --- | --- |
| Omarchy (Quickshell) | `omarchy/module.json` | `install.sh` merges it into `~/.config/omarchy/shell.json` |
| Waybar | `waybar/config.jsonc` + `waybar/style.css` | copy the snippets into `~/.config/waybar/` |

The live Omarchy layout is user config (`~/.config/omarchy/shell.json`) and is
not tracked; `install.sh` and `omarchy/module.json` are the tracked integration.

Only one Strata bar entry is installed: the mini module. It shows the selected
graph value when the mini is closed, and the minimize icon when it is open.
Double-click the mini window to switch to the normal layout and double-click
the normal window to switch back. You can also use `monitor-dock open` or
`strata-monitor open`.

## Swapping monitors

Change `--provider strata` to another provider from `src/infrastructure/providers/`. The bar
adapter does not need to know whether the source is Strata, nvidia-smi, btop,
Prometheus, or anything else.
