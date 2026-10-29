# Architecture

The project separates "what data to show" from "where it is shown". Strata is
the first provider, but the application and bar adapters do not know Strata.

```
┌──────────────────────────────┐   ┌──────────────────────────┐
│ bar/omarchy (Quickshell)     │   │ bar/waybar               │
│  command module              │   │  custom module           │
└──────────────┬───────────────┘   └────────────┬─────────────┘
               │                                │
               └──────────────┬─────────────────┘
                              ▼
                    bin/monitor-dock
              application / CLI / JSON shaping
                              │
                              ▼
              providers/<name>/provider.sh
                    provider contract
                              │
                              ▼
              providers/strata/engine.sh
          Strata use cases + infrastructure
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
     Hyprland             Chromium           Strata /metrics
     window rules         extension/UI       HTTP API
```

## Layer responsibilities

### 1. Presentation adapters (`bar/`)

- Translate bar events into `monitor-dock` calls.
- Translate the normalized JSON into the bar's own schema.
- Own no provider logic.

Omarchy command modules and Waybar custom modules both accept the same
status shape, so the only difference is the configuration syntax.

### 2. Application (`bin/monitor-dock`)

- Resolve `--provider` and the provider's default target.
- Dispatch `status` and lifecycle actions.
- Validate provider status JSON and emit a stable, bar-neutral object.
- Provide `providers` and `targets` introspection.

It intentionally does not know about Hyprland, Chromium, Strata, or any bar.

### 3. Provider contract (`providers/<name>/provider.sh`)

- `targets` describes what the provider can display.
- `status <target>` returns the normalized status object.
- `open|toggle|pin|close|reload|switch` map to the provider's actions.

Adding a provider is a new directory plus a small adapter. The application and
bar adapters do not change.

### 4. Provider implementation (`providers/strata/engine.sh`)

The Strata engine owns:

- config loading and target selection (normal/mini),
- Strata metric formatting for the closed mini bar value,
- Chromium profile/extension generation,
- Hyprland window operations,
- the localhost control server.

This is allowed to be provider-specific and imperative. If it grows, the
Hyprland and Chromium parts can move into `lib/` without changing the provider
contract.

### 5. UI / infrastructure adapters

- `extension/` is a Chromium content-script UI adapter for the Strata page.
- `hypr/strata.lua` is a Hyprland adapter (floating, opacity, pinning).
- `bin/strata-monitor-ctl` is a transport adapter for page-to-shell actions.

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

`text` is required. The other fields are optional. This is a subset of
Waybar's custom-module JSON and is also understood by the Omarchy command
module (`class: "active"` highlights the pinned state).

## Why this stays extensible

- A new resource monitor implements the provider contract and gets both bars
  for free.
- A new bar implements a small adapter and gets every provider for free.
- Lifecycle actions are provider-defined behind a fixed vocabulary.
- The application layer has no hard-coded Strata 2 (or any future monitor)
  assumptions.

## Future cleanups

- Extract `lib/hyprland.sh` and `lib/chromium.sh` from the Strata engine when a
  second window-based provider needs them.
- Add a provider integration test harness that runs the contract against every
  `providers/*/provider.sh`.
- Add an optional `monitor-dock doctor` command that reports provider health and
  missing dependencies.
