import { Graph } from "./graph.js";
import { gb } from "../format.js";

export class VramGraph extends Graph {
  constructor() {
    super({
      id: "vram",
      label: "VRAM",
      series: "gpu_mem_used",
      unit: "GB",
      max: (data) => data?.hardware?.gpu_mem_total ?? null,
    });
  }

  value(data) {
    return data?.hardware?.gpu_mem_used ?? null;
  }

  format(value) {
    return gb(value);
  }

  sub(data) {
    const total = data?.hardware?.gpu_mem_total;
    return total ? `of ${gb(total, 0)} GB` : "";
  }
}
