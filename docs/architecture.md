# Architecture

The project separates "what a graph is and what data it shows" from "where it
is drawn" and from "which external monitor provides the data".

```
src/presentation/bars/{omarchy,waybar}   presentation adapters
                 │
src/presentation/cli/monitor-dock        application / CLI / JSON shaping
                 │
src/core/providers (contract)             core boundary
                 │
src/infrastructure/providers/<name>       provider adapters
                 │
src/infrastructure/providers/strata/      Strata use cases + engine
                 │
   Hyprland | Chromium | Strata /metrics  external systems

src/core/graphs/*.js                     one class per graph
                 │
src/presentation/mini/*.js               Sparkline / StateView / MiniView
```

## Layer responsibilities

### Core (`src/core`)

- `graphs/graph.js` — the `Graph` base class.
- `graphs/<name>-graph.js` — one class per graph: metadata, series name,
  current value extraction, formatting, unit, max, and sub-label.
- `graphs/index.js` — the ordered graph registry. Its order is part of the
  saved mini-index and closed-bar contract.
- `format.js` — number/GB formatting shared by graphs.
- `providers/README.md` — the provider contract.

Graph classes never touch the DOM. They are the single source of truth for the
mini dashboard and for the closed-window bar value.

### Presentation (`src/presentation`)

- `cli/monitor-dock` — bar-agnostic application/primary adapter. Resolves a
  provider and target, validates status JSON, dispatches actions.
- `cli/strata-monitor` — compatibility wrapper for the old CLI.
- `mini/index.html`, `mini.css`, `main.js`, `mini-view.js`, `sparkline.js`,
  `state-view.js` — the local mini dashboard. It is served by the control
  server and uses native ES modules.
- `bars/omarchy/` and `bars/waybar/` — thin bar configuration snippets.

### Infrastructure (`src/infrastructure`)

- `providers/strata/provider.sh` — maps the provider contract to the Strata
  engine.
- `providers/strata/engine.sh` — Strata config, target selection, Chromium
  profiles/extension generation, Hyprland operations, and the closed-bar
  value.
- `providers/strata/graph-value.js` — Node adapter that formats the selected
  graph for the closed mini bar entry by importing the core graph classes.
- `control/strata-monitor-ctl` — localhost server that serves `/mini` and
  `/src/...`, proxies `/metrics`, handles `/switch`, and stores `/graph`.
- `chromium/content/dblclick.js` — content script for the normal Strata page.
- `hyprland/strata.lua` — floating/opacity/pin rules.
- `providers/example/provider.sh` — annotated provider template.

The Strata provider is allowed to be imperative. A different provider can use
any language or transport behind the same provider contract.

## Normalized status shape

```json
{
  "text": "19.1 t/s",
  "tooltip": "Strata mini — Speed 19.1 t/s (closed)",
  "class": "active",
  "alt": "optional short label",
  "percentage": 42
}
```

`text` is required. This is a subset of Waybar's custom-module JSON and is also
understood by the Omarchy command module (`class: "active"` highlights the
pinned state).

## Graph class contract

```js
class SpeedGraph extends Graph {
  constructor() {
    super({ id: "speed", label: "Speed", series: "tok_s", unit: "t/s", dual: true });
    this.prefillSeries = "prefill_tok_s_mean";
  }

  value(data) { /* decode value */ }
  prefillValue(data) { /* prefill value */ }
  format(value) { /* display formatting */ }
  sub(data) { /* footer context */ }
}
```

Rendering is handled by `Sparkline` and `MiniView`; the graph class only
decides *what* is rendered. The bar formatter (`graph-value.js`) uses the same
class, so the bar value and the mini window cannot drift apart.

## Why this stays extensible

- A new resource monitor implements the provider contract and gets both bars
  for free.
- A new bar implements a small adapter and gets every provider for free.
- A new graph is one class plus one line in `graphs/index.js`.
- The application layer has no Strata-specific assumptions.

## Future cleanups

- Move the Hyprland and Chromium helpers from the Strata engine into
  `src/infrastructure/hyprland/` and `src/infrastructure/chromium/` when a
  second window-based provider needs them.
- Add a provider integration test harness that runs the contract against every
  `provider.sh`.
- Add `monitor-dock doctor` for provider health and missing dependencies.
