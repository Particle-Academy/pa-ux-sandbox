import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

function generateCalendarData(year: string): Array<[string, number]> {
  const data: Array<[string, number]> = [];
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    data.push([
      d.toISOString().slice(0, 10),
      Math.round(Math.random() * 10000),
    ]);
  }
  return data;
}

export function CalendarDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Calendar Heatmap</h1>

      <DemoSection title="Basic Calendar" description="GitHub-style contribution calendar.">
        <EChart
          option={{
            tooltip: { position: "top", formatter: (p: any) => `${p.value[0]}: ${p.value[1]}` },
            visualMap: { min: 0, max: 10000, type: "piecewise", orient: "horizontal", left: "center", top: 0,
              pieces: [
                { lte: 1000, color: "#ebedf0" },
                { gt: 1000, lte: 3000, color: "#9be9a8" },
                { gt: 3000, lte: 6000, color: "#40c463" },
                { gt: 6000, lte: 8000, color: "#30a14e" },
                { gt: 8000, color: "#216e39" },
              ],
            },
            calendar: { top: 60, range: "2024", cellSize: [14, 14] },
            series: [{
              type: "heatmap",
              coordinateSystem: "calendar",
              data: generateCalendarData("2024"),
            }],
          }}
          style={{ height: 220 }}
        />
      </DemoSection>

      <DemoSection title="Multi-Year Calendar" description="Stacked calendars for multiple years.">
        <EChart
          option={{
            tooltip: {},
            visualMap: { min: 0, max: 10000, show: false, inRange: { color: ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"] } },
            calendar: [
              { top: 40, range: "2023", cellSize: [12, 12] },
              { top: 180, range: "2024", cellSize: [12, 12] },
            ],
            series: [
              { type: "heatmap", coordinateSystem: "calendar", calendarIndex: 0, data: generateCalendarData("2023") },
              { type: "heatmap", coordinateSystem: "calendar", calendarIndex: 1, data: generateCalendarData("2024") },
            ],
          }}
          style={{ height: 340 }}
        />
      </DemoSection>
    </div>
  );
}
