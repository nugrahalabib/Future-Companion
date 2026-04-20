// Shared visual tokens for every Recharts chart in the admin dashboard.
// Kept in one place so palette tweaks stay consistent across tabs.

export const ADMIN_COLORS = [
  "#00F0FF",
  "#39FF14",
  "#FF6B6B",
  "#FFD93D",
  "#6C5CE7",
  "#A8E6CF",
  "#FF9F43",
  "#F368E0",
];

export const CHART_TOOLTIP_STYLE = {
  background: "#0F0F0F",
  border: "1px solid rgba(0,240,255,0.18)",
  borderRadius: 10,
  padding: "8px 12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
} as const;

export const CHART_TOOLTIP_LABEL_STYLE = {
  color: "#F0F0F0",
  fontFamily: "var(--font-space-grotesk, monospace)",
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

export const AXIS_STROKE = "#8A8A8A";
export const GRID_STROKE = "#2A2A2A";
