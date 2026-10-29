import { Graph } from "./graph.js";
import { fmt } from "../format.js";

export class PowerGraph extends Graph {
  constructor() {
    super({
      id: "power",
      label: "Power",
      series: "gpu_power",
      unit: "W",
      max: (data) => data?.hardware?.gpu_power_limit ?? null,
    });
  }

  value(data) {
    return data?.hardware?.gpu_power ?? null;
  }

  format(value) {
    return fmt(value, 0);
  }

  sub(data) {
    const limit = data?.hardware?.gpu_power_limit;
    return limit ? `of ${fmt(limit)} W limit` : "";
  }
}
