// Mini Strata monitor. Runs as an extension content script on the Strata page,
// but only when the URL has ?mini=1. It overlays a tiny single-graph dashboard
// and leaves the real app hidden (so its own polling keeps working).
(() => {
  const cfg = globalThis.STRATA_CONFIG || {};
  const isMini = new URLSearchParams(location.search).has("mini");
  if (!isMini || globalThis.__strataMiniStarted) return;
  globalThis.__strataMiniStarted = true;

  document.documentElement.dataset.strataMini = "1";
  try { document.title = "Strata Mini"; } catch (e) {}

  const ready = () => start().catch((err) => showFatal(err));
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }

  // ---------------------------------------------------------------- helpers
  const $ = (id) => document.getElementById(id);

  const fmt = (n, d = 0) =>
    n == null || Number.isNaN(Number(n))
      ? "\u2013"
      : Number(n).toLocaleString(undefined, {
          maximumFractionDigits: d,
          minimumFractionDigits: d,
        });

  const gb = (bytes, d = 1) => (bytes == null ? "\u2013" : fmt(Number(bytes) / 1073741824, d));

  function showFatal(err) {
    try {
      const root = document.createElement("div");
      root.id = "strata-mini-root";
      root.innerHTML = `<div class="mini-error">Mini monitor failed: ${String(err && err.message ? err.message : err)}</div>`;
      document.body.appendChild(root);
      document.documentElement.dataset.strataMiniReady = "1";
    } catch (e) {}
  }

  async function loadShell() {
    try {
      const res = await fetch(chrome.runtime.getURL("mini.html"), { cache: "no-store" });
      if (res.ok) return await res.text();
    } catch (e) {}
    return `<div class="mini-error">Could not load mini.html</div>`;
  }

  // ---------------------------------------------------------------- metrics
  const METRICS = [
    {
      key: "speed",
      label: "Speed",
      series: "tok_s",
      prefillSeries: "prefill_tok_s_mean",
      dual: true,
      decodeValue: (m) =>
        m.live.state === "generating"
          ? m.live.tok_s
          : m.requests?.[0]
            ? m.requests[0].decode_tok_s
            : null,
      prefillValue: (m) => {
        if (m.live.state !== "idle") return m.live.prefill_tok_s_mean;
        const last = m.requests?.[0];
        return last && last.prompt_ms > 0
          ? Math.max(0, (last.prompt_tokens || 0) - (last.reused || 0)) / (last.prompt_ms / 1000)
          : null;
      },
      formatDecode: (v) => fmt(v, 1),
      formatPrefill: (v) => fmt(v, 0),
      sub: (m) =>
        m.live.state === "generating"
          ? "decode now \u00b7 prefill this request"
          : m.live.state === "reading"
            ? "decode last request \u00b7 prefill now"
            : "decode \u00b7 prefill last request",
    },
    {
      key: "gpu",
      label: "GPU load",
      unit: "%",
      series: "gpu_util",
      max: 100,
      value: (m) => m.hardware.gpu_util,
      format: (v) => fmt(v, 0),
      sub: (m) => m.hardware_static.gpu_name || "",
    },
    {
      key: "vram",
      label: "VRAM",
      unit: "GB",
      series: "gpu_mem_used",
      max: (m) => m.hardware.gpu_mem_total,
      value: (m) => m.hardware.gpu_mem_used,
      format: (v) => gb(v),
      sub: (m) =>
        m.hardware.gpu_mem_total ? `of ${gb(m.hardware.gpu_mem_total, 0)} GB` : "",
    },
    {
      key: "temp",
      label: "GPU temp",
      unit: "\u00b0C",
      series: "gpu_temp",
      max: 90,
      value: (m) => m.hardware.gpu_temp,
      format: (v) => fmt(v, 0),
      sub: () => "",
    },
    {
      key: "power",
      label: "Power",
      unit: "W",
      series: "gpu_power",
      max: (m) => m.hardware.gpu_power_limit,
      value: (m) => m.hardware.gpu_power,
      format: (v) => fmt(v, 0),
      sub: (m) =>
        m.hardware.gpu_power_limit ? `of ${fmt(m.hardware.gpu_power_limit)} W limit` : "",
    },
    {
      key: "pcie",
      label: "PCIe",
      unit: "MB/s",
      series: "gpu_pcie_rx_mb",
      value: (m) => m.hardware.gpu_pcie_rx_mb,
      format: (v) => fmt(v, v < 10 ? 1 : 0),
      sub: (m) => {
        const gen = m.hardware.gpu_pcie_gen ? `Gen${m.hardware.gpu_pcie_gen}` : "";
        const width = m.hardware.gpu_pcie_width ? `x${m.hardware.gpu_pcie_width}` : "";
        return `${gen}${gen && width ? " " : ""}${width}${gen || width ? " to GPU" : ""}`;
      },
    },
    {
      key: "cpu",
      label: "CPU",
      unit: "%",
      series: "cpu",
      max: 100,
      value: (m) => m.hardware.cpu,
      format: (v) => fmt(v, 0),
      sub: (m) => {
        const cores = m.hardware_static.cores;
        const threads = m.hardware_static.threads;
        return threads ? `${cores ? `${cores} cores \u00b7 ` : ""}${threads} threads` : "";
      },
    },
    {
      key: "disk",
      label: "Disk read",
      unit: (m, v) => (v >= 1000 ? "GB/s" : "MB/s"),
      series: "disk_read_mb",
      value: (m) => m.hardware.disk_read_mb,
      format: (v) => (v >= 1000 ? fmt(v / 1024, 2) : fmt(v, v < 10 ? 1 : 0)),
      sub: (m) =>
        m.hardware.disk_write_mb == null ? "" : `write ${fmt(m.hardware.disk_write_mb, 1)} MB/s`,
    },
  ];

  let metricIndex = 0;
  let restoredIndex = false;
  try {
    const saved = Number(localStorage.getItem("strata-mini.metric"));
    if (Number.isInteger(saved) && saved >= 0 && saved < METRICS.length) {
      metricIndex = saved;
      restoredIndex = true;
    }
  } catch (e) {}
  if (!restoredIndex) {
    const saved = Number(cfg.miniGraph);
    if (Number.isInteger(saved) && saved >= 0 && saved < METRICS.length) metricIndex = saved;
  }

  let lastData = null;
  let els = null;

  function drawSeries(line, area, values, max) {
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

  function drawSpark(values, max, prefillValues, prefillMax) {
    if (!els) return;
    drawSeries(els.decodeLine, els.decodeArea, values, max);
    drawSeries(els.prefillLine, els.prefillArea, prefillValues, prefillMax);
  }

  function renderMetric(m) {
    if (!els) return;
    const metric = METRICS[metricIndex];
    els.metricLabel.textContent = metric.label;
    els.metricIndex.textContent = `${metricIndex + 1} / ${METRICS.length}`;

    if (metric.dual) {
      els.singleValue.hidden = true;
      els.dual.hidden = false;
      const decode = m ? metric.decodeValue(m) : null;
      const prefill = m ? metric.prefillValue(m) : null;
      els.decodeValue.textContent = decode == null ? "\u2013" : metric.formatDecode(decode);
      els.prefillValue.textContent = prefill == null ? "\u2013" : metric.formatPrefill(prefill);
      els.metricSub.textContent = m ? metric.sub(m) || "" : "";
      drawSpark(
        m?.history?.[metric.series],
        null,
        m?.history?.[metric.prefillSeries],
        null,
      );
      return;
    }

    els.singleValue.hidden = false;
    els.dual.hidden = true;
    const value = m ? metric.value(m) : null;
    els.metricValue.textContent = value == null ? "\u2013" : metric.format(value);
    els.metricUnit.textContent =
      value == null ? "" : typeof metric.unit === "function" ? metric.unit(m, value) : metric.unit;
    els.metricSub.textContent = m ? metric.sub(m) || "" : "";
    const max = m ? (typeof metric.max === "function" ? metric.max(m) : metric.max) : null;
    drawSpark(m?.history?.[metric.series], max, [], null);
  }

  function renderState(m) {
    if (!els) return;
    const live = m.live || {};
    const last = (m.requests || [])[0];
    let pillText = "Idle";
    let state = live.state || "idle";

    if (live.state === "reading") {
      const pct = live.prompt_total
        ? Math.round((100 * live.prompt_read) / live.prompt_total)
        : null;
      pillText = pct != null ? `Reading \u00b7 ${pct}%` : "Reading";
    } else if (live.state === "generating") {
      pillText = `Generating \u00b7 ${fmt(live.tok_s, 1)} tok/s`;
    }
    if (live.queued > 0) {
      state = "queued";
      pillText = `${fmt(live.queued)} queued`;
    }

    els.pill.dataset.state = state;
    els.pillText.textContent = pillText;

    let label = "Waiting for a request";
    let detail = "";
    let pct = 0;
    if (live.state === "reading") {
      label = "Reading prompt";
      if (live.prompt_total) {
        pct = (100 * live.prompt_read) / live.prompt_total;
        detail = `${fmt(live.prompt_read)} / ${fmt(live.prompt_total)} tokens \u00b7 ${fmt(pct)}%`;
      } else {
        detail = `${fmt(live.prompt_tokens)} tokens`;
      }
    } else if (live.state === "generating") {
      label = live.phase ? live.phase[0].toUpperCase() + live.phase.slice(1) : "Generating";
      pct = live.max_tokens ? Math.min(100, (100 * live.generated) / live.max_tokens) : 0;
      detail = `${fmt(live.generated)} tokens \u00b7 ${fmt(live.tok_s, 1)} tok/s`;
    } else if (last) {
      detail = `last: ${fmt(last.output_tokens)} tokens${
        last.decode_tok_s ? ` at ${fmt(last.decode_tok_s, 1)} tok/s` : ""
      }`;
    }

    els.stateLabel.textContent = label;
    els.stateDetail.textContent = detail;
    els.stateBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    els.stateBar.dataset.state = state;
  }

  function renderError(message) {
    if (!els) return;
    els.pill.dataset.state = "error";
    els.pillText.textContent = message;
  }

  function select(index) {
    metricIndex = (index + METRICS.length) % METRICS.length;
    try { localStorage.setItem("strata-mini.metric", String(metricIndex)); } catch (e) {}
    if (cfg.controlUrl) {
      fetch(`${cfg.controlUrl}/graph?n=${metricIndex}`, { mode: "no-cors", cache: "no-store" }).catch(
        () => {},
      );
    }
    renderMetric(lastData);
  }

  // ---------------------------------------------------------------- startup
  async function start() {
    const shell = await loadShell();
    const root = document.createElement("div");
    root.id = "strata-mini-root";
    root.innerHTML = shell;
    document.body.appendChild(root);
    document.documentElement.dataset.strataMiniReady = "1";
    try { document.title = "Strata Mini"; } catch (e) {}

    els = {
      pill: $("mini-pill"),
      pillText: $("mini-pill-text"),
      stateLabel: $("mini-state-label"),
      stateDetail: $("mini-state-detail"),
      stateBar: $("mini-state-bar"),
      metricLabel: $("mini-metric-label"),
      singleValue: $("mini-single-value"),
      metricValue: $("mini-metric-value"),
      metricUnit: $("mini-metric-unit"),
      dual: $("mini-dual"),
      decodeValue: $("mini-decode-value"),
      prefillValue: $("mini-prefill-value"),
      metricSub: $("mini-metric-sub"),
      metricIndex: $("mini-metric-index"),
      spark: $("mini-spark"),
      decodeLine: $("mini-decode-line"),
      decodeArea: $("mini-decode-area"),
      prefillLine: $("mini-prefill-line"),
      prefillArea: $("mini-prefill-area"),
    };

    $("mini-prev").addEventListener("click", (event) => {
      event.stopPropagation();
      select(metricIndex - 1);
    });
    $("mini-next").addEventListener("click", (event) => {
      event.stopPropagation();
      select(metricIndex + 1);
    });

    addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") select(metricIndex - 1);
      else if (event.key === "ArrowRight") select(metricIndex + 1);
    });

    root.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) < 15) return;
        event.preventDefault();
        select(metricIndex + (event.deltaY > 0 ? 1 : -1));
      },
      { passive: false },
    );

    renderMetric(null);

    const api = new URL(cfg.apiUrl || "http://ai-brain:8080/");
    api.hash = "";
    const metricsUrl = new URL("metrics", api).href;
    const headers = cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};

    const poll = async () => {
      try {
        const res = await fetch(metricsUrl, { headers, cache: "no-store" });
        if (res.status === 401) {
          renderError("API key needed");
        } else if (res.ok) {
          lastData = await res.json();
          renderState(lastData);
          renderMetric(lastData);
        } else {
          renderError(`HTTP ${res.status}`);
        }
      } catch (e) {
        renderError("Server unreachable");
      }
      setTimeout(poll, 1000);
    };

    poll();
    setInterval(() => {
      if (document.title !== "Strata Mini") {
        try { document.title = "Strata Mini"; } catch (e) {}
      }
    }, 1000);
  }
})();
