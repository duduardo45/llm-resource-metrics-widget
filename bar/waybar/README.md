# Waybar adapter

Waybar uses the same normalized JSON as the Omarchy module. The application
layer (`monitor-dock`) and provider layer (`providers/strata`) do not change.

1. Add the module from `config.jsonc` to `~/.config/waybar/config.jsonc`.
2. Add `"custom/strata-mini"` to the `modules-right` array of the bar you use.
3. Optionally copy the rules from `style.css` into `~/.config/waybar/style.css`.
4. Restart/reload Waybar.

The command path is `~/.local/bin/monitor-dock`; `install.sh` creates that
symlink. The module emits:

```json
{"text":"19.1 t/s","tooltip":"Strata mini — Speed 19.1 t/s (closed)","class":""}
```

Waybar applies `class` to the widget, so `#custom-strata-mini.active` highlights
the pinned state. When the mini is closed the `text` is the selected graph's
value; when it is open the text is the mini icon.
