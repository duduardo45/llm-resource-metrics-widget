import { MiniView } from "./mini-view.js";

const view = new MiniView({
  onSelect: (index) => {
    fetch(`/graph?n=${index}`, { cache: "no-store" }).catch(() => {});
  },
  onSwitch: () => {
    fetch("/switch", { cache: "no-store" }).catch(() => {});
  },
});

fetch("/graph", { cache: "no-store" })
  .then((res) => (res.ok ? res.text() : "0"))
  .then((text) => {
    const index = Number(text.trim());
    if (Number.isInteger(index)) view.setIndex(index, { persist: false });
  })
  .catch(() => {});

async function poll() {
  try {
    const res = await fetch("/metrics", { cache: "no-store" });
    if (res.ok) {
      view.render(await res.json());
    } else {
      view.error(`HTTP ${res.status}`);
    }
  } catch (error) {
    view.error("Server unreachable");
  }
  setTimeout(poll, 1000);
}

poll();
