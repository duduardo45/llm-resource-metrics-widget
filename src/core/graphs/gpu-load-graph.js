import { Graph } from "./graph.js";
import { fmt } from "../format.js";

export class GpuLoadGraph extends Graph {
  constructor() {
    super({ id: "gpu", label: "GPU load", series: "gpu_util", unit: "%", max: 100 });
  }

  value(data) {
    return data?.hardware?.gpu_util ?? null;
  }

  format(value) {
    return fmt(value, 0);
  }

  sub(data) {
    return data?.hardware_static?.gpu_name ?? "";
  }
}
