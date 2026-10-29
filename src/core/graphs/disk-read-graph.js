import { Graph } from "./graph.js";
import { fmt } from "../format.js";

export class DiskReadGraph extends Graph {
  constructor() {
    super({
      id: "disk",
      label: "Disk read",
      series: "disk_read_mb",
      unit: (data, value) => (value >= 1000 ? "GB/s" : "MB/s"),
    });
  }

  value(data) {
    return data?.hardware?.disk_read_mb ?? null;
  }

  format(value) {
    return value >= 1000 ? fmt(value / 1024, 2) : fmt(value, value < 10 ? 1 : 0);
  }

  sub(data) {
    const write = data?.hardware?.disk_write_mb;
    return write == null ? "" : `write ${fmt(write, 1)} MB/s`;
  }
}
