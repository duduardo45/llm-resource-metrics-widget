// Double-click anywhere on the floating Strata window (except its controls)
// asks the local control server to switch between the normal and mini layouts.
(() => {
  if (globalThis.__strataMonitorDblclick) return;
  globalThis.__strataMonitorDblclick = true;

  window.addEventListener(
    "dblclick",
    (event) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (target && target.closest && target.closest("button, a, input, textarea, select, [role='button']")) {
        return;
      }
      const cfg = globalThis.STRATA_CONFIG || {};
      if (!cfg.controlUrl) return;
      fetch(`${cfg.controlUrl}/switch`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
    },
    true,
  );
})();
