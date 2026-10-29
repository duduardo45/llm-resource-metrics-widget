import { Graph } from "./graph.js";
import { fmt } from "../format.js";

export class SpeedGraph extends Graph {
  constructor() {
    super({
      id: "speed",
      label: "Speed",
      series: "tok_s",
      unit: "t/s",
      dual: true,
    });
    this.prefillSeries = "prefill_tok_s_mean";
  }

  value(data) {
    const live = data?.live ?? {};
    const last = data?.requests?.[0];
    if (live.state === "generating") return live.tok_s;
    return last ? last.decode_tok_s : null;
  }

  prefillValue(data) {
    const live = data?.live ?? {};
    if (live.state !== "idle") return live.prefill_tok_s_mean;
    const last = data?.requests?.[0];
    return last && last.prompt_ms > 0
      ? Math.max(0, (last.prompt_tokens || 0) - (last.reused || 0)) / (last.prompt_ms / 1000)
      : null;
  }

  format(value) {
    return fmt(value, 1);
  }

  formatPrefill(value) {
    return fmt(value, 0);
  }

  sub(data) {
    const state = data?.live?.state;
    if (state === "generating") return "decode now \u00b7 prefill this request";
    if (state === "reading") return "decode last request \u00b7 prefill now";
    return "decode \u00b7 prefill last request";
  }
}
