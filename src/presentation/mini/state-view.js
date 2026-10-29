import { fmt } from "../../core/format.js";

export class StateView {
  constructor() {
    this.pill = document.getElementById("mini-pill");
    this.pillText = document.getElementById("mini-pill-text");
    this.label = document.getElementById("mini-state-label");
    this.detail = document.getElementById("mini-state-detail");
    this.bar = document.getElementById("mini-state-bar");
  }

  render(data) {
    const live = data?.live ?? {};
    const last = data?.requests?.[0];
    let pillText = "Idle";
    let state = live.state || "idle";

    if (live.state === "reading") {
      const pct = live.prompt_total
        ? Math.round((100 * live.prompt_read) / live.prompt_total)
        : null;
      pillText = pct != null ? `Reading \u00b7 ${pct}%` : "Reading";
    } else if (live.state === "generating") {
      pillText = `Generating \u00b7 ${fmt(live.tok_s, 1)} tok/s`;
    }
    if (live.queued > 0) {
      state = "queued";
      pillText = `${fmt(live.queued)} queued`;
    }

    this.pill.dataset.state = state;
    this.pillText.textContent = pillText;

    let label = "Waiting for a request";
    let detail = "";
    let pct = 0;
    if (live.state === "reading") {
      label = "Reading prompt";
      if (live.prompt_total) {
        pct = (100 * live.prompt_read) / live.prompt_total;
        detail = `${fmt(live.prompt_read)} / ${fmt(live.prompt_total)} tokens \u00b7 ${fmt(pct)}%`;
      } else {
        detail = `${fmt(live.prompt_tokens)} tokens`;
      }
    } else if (live.state === "generating") {
      label = live.phase ? live.phase[0].toUpperCase() + live.phase.slice(1) : "Generating";
      pct = live.max_tokens ? Math.min(100, (100 * live.generated) / live.max_tokens) : 0;
      detail = `${fmt(live.generated)} tokens \u00b7 ${fmt(live.tok_s, 1)} tok/s`;
    } else if (last) {
      detail = `last: ${fmt(last.output_tokens)} tokens${
        last.decode_tok_s ? ` at ${fmt(last.decode_tok_s, 1)} tok/s` : ""
      }`;
    }

    this.label.textContent = label;
    this.detail.textContent = detail;
    this.bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    this.bar.dataset.state = state;
  }

  error(message) {
    this.pill.dataset.state = "error";
    this.pillText.textContent = message;
  }
}
