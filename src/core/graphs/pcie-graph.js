import { Graph } from "./graph.js";
import { fmt } from "../format.js";

export class PcieGraph extends Graph {
  constructor() {
    super({ id: "pcie", label: "PCIe", series: "gpu_pcie_rx_mb", unit: "MB/s" });
  }

  value(data) {
    return data?.hardware?.gpu_pcie_rx_mb ?? null;
  }

  format(value) {
    return fmt(value, value < 10 ? 1 : 0);
  }

  sub(data) {
    const hw = data?.hardware ?? {};
    const gen = hw.gpu_pcie_gen ? `Gen${hw.gpu_pcie_gen}` : "";
    const width = hw.gpu_pcie_width ? `x${hw.gpu_pcie_width}` : "";
    return `${gen}${gen && width ? " " : ""}${width}${gen || width ? " to GPU" : ""}`;
  }
}
