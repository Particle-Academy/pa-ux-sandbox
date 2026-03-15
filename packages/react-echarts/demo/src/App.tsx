import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { registerAll } from "@particle-academy/react-echarts";

// Register all ECharts components for the demo
registerAll();

import { DemoLayout } from "./layouts/DemoLayout";

// 2D Charts
import { LineDemo } from "./pages/LineDemo";
import { BarDemo } from "./pages/BarDemo";
import { PieDemo } from "./pages/PieDemo";
import { ScatterDemo } from "./pages/ScatterDemo";
import { RadarDemo } from "./pages/RadarDemo";
import { HeatmapDemo } from "./pages/HeatmapDemo";
import { CandlestickDemo } from "./pages/CandlestickDemo";
import { BoxplotDemo } from "./pages/BoxplotDemo";
import { TreemapDemo } from "./pages/TreemapDemo";
import { SunburstDemo } from "./pages/SunburstDemo";
import { FunnelDemo } from "./pages/FunnelDemo";
import { GaugeDemo } from "./pages/GaugeDemo";
import { SankeyDemo } from "./pages/SankeyDemo";
import { GraphDemo } from "./pages/GraphDemo";
import { ParallelDemo } from "./pages/ParallelDemo";
import { ThemeRiverDemo } from "./pages/ThemeRiverDemo";
import { CalendarDemo } from "./pages/CalendarDemo";
import { PictorialBarDemo } from "./pages/PictorialBarDemo";
import { MapDemo } from "./pages/MapDemo";
import { CustomDemo } from "./pages/CustomDemo";

// 3D Charts
import { Bar3DDemo } from "./pages/Bar3DDemo";
import { Scatter3DDemo } from "./pages/Scatter3DDemo";
import { SurfaceDemo } from "./pages/SurfaceDemo";
import { GlobeDemo } from "./pages/GlobeDemo";

// Other
import { GraphicDemo } from "./pages/GraphicDemo";

export function App(): React.ReactElement {
  return (
    <Routes>
      <Route element={<DemoLayout />}>
        <Route index element={<Navigate to="/line" replace />} />

        {/* 2D Charts */}
        <Route path="line" element={<LineDemo />} />
        <Route path="bar" element={<BarDemo />} />
        <Route path="pie" element={<PieDemo />} />
        <Route path="scatter" element={<ScatterDemo />} />
        <Route path="radar" element={<RadarDemo />} />
        <Route path="heatmap" element={<HeatmapDemo />} />
        <Route path="candlestick" element={<CandlestickDemo />} />
        <Route path="boxplot" element={<BoxplotDemo />} />
        <Route path="treemap" element={<TreemapDemo />} />
        <Route path="sunburst" element={<SunburstDemo />} />
        <Route path="funnel" element={<FunnelDemo />} />
        <Route path="gauge" element={<GaugeDemo />} />
        <Route path="sankey" element={<SankeyDemo />} />
        <Route path="graph" element={<GraphDemo />} />
        <Route path="parallel" element={<ParallelDemo />} />
        <Route path="theme-river" element={<ThemeRiverDemo />} />
        <Route path="calendar" element={<CalendarDemo />} />
        <Route path="pictorial-bar" element={<PictorialBarDemo />} />
        <Route path="map" element={<MapDemo />} />
        <Route path="custom" element={<CustomDemo />} />

        {/* 3D Charts */}
        <Route path="bar-3d" element={<Bar3DDemo />} />
        <Route path="scatter-3d" element={<Scatter3DDemo />} />
        <Route path="surface" element={<SurfaceDemo />} />
        <Route path="globe" element={<GlobeDemo />} />

        {/* Other */}
        <Route path="graphic" element={<GraphicDemo />} />
      </Route>
    </Routes>
  );
}
