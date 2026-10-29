-- Strata floating monitor windows (normal and mini). The launcher sizes and
-- positions them from ~/.config/strata-monitor/config.json.
--
-- Opacity is matched by class because the title is not final yet when the
-- window is first mapped; the title rules also cover reloads and other hosts.
o.window({ class = "^chrome-ai-brain__-Default$" }, {
  float = true,
  tag = "-default-opacity",
  opacity = "1 1",
  border_size = 1,
})

o.window({ title = "^(Strata|Strata Mini)$" }, {
  float = true,
  tag = "-default-opacity",
  opacity = "1 1",
  border_size = 1,
})

-- URL-derived Chromium app windows get their app_id at map time. Keep them
-- opaque (the dedicated Strata profiles should never show the desktop through).
o.window({ class = "^chrome-" }, {
  tag = "-default-opacity",
  opacity = "1 1",
})
