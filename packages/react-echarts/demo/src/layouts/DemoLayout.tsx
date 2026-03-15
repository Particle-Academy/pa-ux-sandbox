import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const navGroups = [
  {
    label: "2D Charts",
    items: [
      { to: "/line", label: "Line" },
      { to: "/bar", label: "Bar" },
      { to: "/pie", label: "Pie" },
      { to: "/scatter", label: "Scatter" },
      { to: "/radar", label: "Radar" },
      { to: "/heatmap", label: "Heatmap" },
      { to: "/candlestick", label: "Candlestick" },
      { to: "/boxplot", label: "Boxplot" },
      { to: "/treemap", label: "Treemap" },
      { to: "/sunburst", label: "Sunburst" },
      { to: "/funnel", label: "Funnel" },
      { to: "/gauge", label: "Gauge" },
      { to: "/sankey", label: "Sankey" },
      { to: "/graph", label: "Graph" },
      { to: "/parallel", label: "Parallel" },
      { to: "/theme-river", label: "Theme River" },
      { to: "/calendar", label: "Calendar" },
      { to: "/pictorial-bar", label: "Pictorial Bar" },
      { to: "/map", label: "Map" },
      { to: "/custom", label: "Custom" },
    ],
  },
  {
    label: "3D Charts",
    items: [
      { to: "/bar-3d", label: "Bar 3D" },
      { to: "/scatter-3d", label: "Scatter 3D" },
      { to: "/surface", label: "Surface" },
      { to: "/globe", label: "Globe" },
    ],
  },
  {
    label: "Other",
    items: [{ to: "/graphic", label: "Graphic Layer" }],
  },
];

export function DemoLayout(): React.ReactElement {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 220,
          background: "#1f2937",
          color: "#d1d5db",
          padding: "20px 0",
          overflowY: "auto",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <div
          style={{
            padding: "0 20px 20px",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            borderBottom: "1px solid #374151",
            marginBottom: 12,
          }}
        >
          React ECharts
        </div>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <div
              style={{
                padding: "4px 20px",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#9ca3af",
                fontWeight: 600,
              }}
            >
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: "block",
                  padding: "6px 20px",
                  fontSize: 14,
                  color: isActive ? "#fff" : "#d1d5db",
                  background: isActive ? "#374151" : "transparent",
                  borderLeft: isActive
                    ? "3px solid #3b82f6"
                    : "3px solid transparent",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <main
        style={{
          marginLeft: 220,
          flex: 1,
          padding: 32,
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
