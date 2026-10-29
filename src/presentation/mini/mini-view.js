import { GRAPHS } from "../../core/graphs/index.js";
import { Sparkline } from "./sparkline.js";
import { StateView } from "./state-view.js";

export class MiniView {
  constructor({ onSelect, onSwitch } = {}) {
    this.graphs = GRAPHS;
    this.index = 0;
    this.lastData = null;
    this.onSelect = onSelect;
    this.onSwitch = onSwitch;
    this.state = new StateView();
    this.spark = new Sparkline();

    this.label = document.getElementById("mini-metric-label");
    this.single = document.getElementById("mini-single-value");
    this.value = document.getElementById("mini-metric-value");
    this.unit = document.getElementById("mini-metric-unit");
    this.dual = document.getElementById("mini-dual");
    this.decode = document.getElementById("mini-decode-value");
    this.prefill = document.getElementById("mini-prefill-value");
    this.sub = document.getElementById("mini-metric-sub");
    this.indexEl = document.getElementById("mini-metric-index");

    document.getElementById("mini-prev").addEventListener("click", (event) => {
      event.stopPropagation();
      this.select(this.index - 1);
    });
    document.getElementById("mini-next").addEventListener("click", (event) => {
      event.stopPropagation();
      this.select(this.index + 1);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") this.select(this.index - 1);
      else if (event.key === "ArrowRight") this.select(this.index + 1);
    });

    window.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) < 15) return;
        event.preventDefault();
        this.select(this.index + (event.deltaY > 0 ? 1 : -1));
      },
      { passive: false },
    );

    window.addEventListener(
      "dblclick",
      (event) => {
        const target = event.target;
        if (target?.closest?.("button, a, input, textarea, select, [role='button']")) return;
        this.onSwitch?.();
      },
      true,
    );

    this.renderGraph();
  }

  setIndex(index, { persist = true } = {}) {
    if (!Number.isInteger(index)) return;
    this.index = ((index % this.graphs.length) + this.graphs.length) % this.graphs.length;
    if (persist) this.onSelect?.(this.index);
    this.renderGraph();
  }

  select(index) {
    this.setIndex(index, { persist: true });
  }

  render(data) {
    this.lastData = data;
    this.state.render(data);
    this.renderGraph();
  }

  error(message) {
    this.state.error(message);
  }

  renderGraph() {
    const graph = this.graphs[this.index];
    const data = this.lastData;
    this.label.textContent = graph.label;
    this.indexEl.textContent = `${this.index + 1} / ${this.graphs.length}`;

    if (graph.dual) {
      this.single.hidden = true;
      this.dual.hidden = false;
      const decode = data ? graph.value(data) : null;
      const prefill = data ? graph.prefillValue(data) : null;
      this.decode.textContent = decode == null ? "\u2013" : graph.format(decode);
      this.prefill.textContent = prefill == null ? "\u2013" : graph.formatPrefill(prefill);
      this.sub.textContent = data ? graph.sub(data) || "" : "";
    } else {
      this.single.hidden = false;
      this.dual.hidden = true;
      const value = data ? graph.value(data) : null;
      this.value.textContent = value == null ? "\u2013" : graph.format(value);
      this.unit.textContent = value == null ? "" : graph.unitFor(data, value);
      this.sub.textContent = data ? graph.sub(data) || "" : "";
    }

    this.spark.render(graph, data);
  }
}
