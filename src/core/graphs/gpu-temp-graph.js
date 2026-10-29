import { Graph } from "./graph.js";
import { fmt } from "../format.js";

export class GpuTempGraph extends Graph {
  constructor() {
    super({ id: "temp", label: "GPU temp", series: "gpu_temp", unit: "\u00b0C", max: 90 });
  }

  value(data) {
    return data?.hardware?.gpu_temp ?? null;
  }

  format(value) {
    return fmt(value, 0);
  }
}
