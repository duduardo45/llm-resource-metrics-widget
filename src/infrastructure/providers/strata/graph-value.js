#!/usr/bin/env node
// Shared graph formatter for bar status. It imports the same core graph classes
// used by the mini UI, so the closed-window bar value cannot drift from the
// graph definitions.
import { readFileSync } from "node:fs";
import { GRAPHS } from "../../../core/graphs/index.js";

const index = Number(process.argv[2] ?? 0);
const graph = GRAPHS[index] ?? GRAPHS[0];

let data;
try {
  data = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(1);
}

process.stdout.write(`${graph.label}\t${graph.display(data)}\n`);
