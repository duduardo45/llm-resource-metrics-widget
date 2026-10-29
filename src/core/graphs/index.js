import { SpeedGraph } from "./speed-graph.js";
import { GpuLoadGraph } from "./gpu-load-graph.js";
import { VramGraph } from "./vram-graph.js";
import { GpuTempGraph } from "./gpu-temp-graph.js";
import { PowerGraph } from "./power-graph.js";
import { PcieGraph } from "./pcie-graph.js";
import { CpuGraph } from "./cpu-graph.js";
import { DiskReadGraph } from "./disk-read-graph.js";

// Order is part of the contract: the saved mini graph index and the closed-bar
// value use it.
export const GRAPHS = [
  new SpeedGraph(),
  new GpuLoadGraph(),
  new VramGraph(),
  new GpuTempGraph(),
  new PowerGraph(),
  new PcieGraph(),
  new CpuGraph(),
  new DiskReadGraph(),
];

export { Graph } from "./graph.js";
