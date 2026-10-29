export class Sparkline {
  constructor() {
    this.decodeLine = document.getElementById("mini-decode-line");
    this.decodeArea = document.getElementById("mini-decode-area");
    this.prefillLine = document.getElementById("mini-prefill-line");
    this.prefillArea = document.getElementById("mini-prefill-area");
  }

  drawSeries(line, area, values, max) {
    const v = (values || []).map((x) => (x == null ? 0 : Number(x)));
    if (v.length < 2) {
      line.setAttribute("d", "");
      area.setAttribute("d", "");
      return;
    }
    const top = Math.max(Number(max) || 0, ...v, 1e-9);
    const pts = v.map((x, i) => [(i / (v.length - 1)) * 100, 40 - (x / top) * 36]);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("");
    line.setAttribute("d", d);
    area.setAttribute("d", `${d}L100,40L0,40Z`);
  }

  render(graph, data) {
    this.drawSeries(this.decodeLine, this.decodeArea, graph.sparkValues(data), graph.sparkMax(data));
    if (graph.dual) {
      this.drawSeries(
        this.prefillLine,
        this.prefillArea,
        graph.prefillValues(data),
        graph.prefillMax(data),
      );
    } else {
      this.prefillLine.setAttribute("d", "");
      this.prefillArea.setAttribute("d", "");
    }
  }
}
