import { Graph } from "./graph.js";
import { fmt } from "../format.js";

export class CpuGraph extends Graph {
  constructor() {
    super({ id: "cpu", label: "CPU", series: "cpu", unit: "%", max: 100 });
  }

  value(data) {
    return data?.hardware?.cpu ?? null;
  }

  format(value) {
    return fmt(value, 0);
  }

  sub(data) {
    const cores = data?.hardware_static?.cores;
    const threads = data?.hardware_static?.threads;
    return threads ? `${cores ? `${cores} cores \u00b7 ` : ""}${threads} threads` : "";
  }
}
