import type { ComponentDoc } from "./types";
import { type EChartsOption, EChart3D } from "@particle-academy/fancy-echarts";

/**
 * Typed loosely on purpose: `surface`, `grid3D` and the `*Axis3D` components
 * come from echarts-gl, whose types are not part of core ECharts' option union.
 * `EChart3D` is the component that loads them, so the config is valid — the
 * core `EChartsOption` type simply cannot describe it.
 */
const surfaceOption = {
    grid3D: { viewControl: { autoRotate: true, autoRotateSpeed: 5 } },
    xAxis3D: { type: "value" },
    yAxis3D: { type: "value" },
    zAxis3D: { type: "value" },
    // `surface` is an echarts-gl series; core ECharts' SeriesOption union
    // does not include the GL types, and EChart3D is the component that loads them.
    series: [
        {
            type: "surface",
            shading: "color",
            equation: {
                x: { step: 0.5, min: -3, max: 3 },
                y: { step: 0.5, min: -3, max: 3 },
                z: (x: number, y: number) => Math.sin(x * x + y * y) / (x * x + y * y),
            },
            itemStyle: { color: "#8b5cf6" },
        },
    ],
} as EChartsOption;

export const echart3dDoc: ComponentDoc = {
    intro: (
        <p>
            Same wrapper as <code>EChart</code>, but pre-loads the{" "}
            <code>echarts-gl</code> extensions for 3D chart types — globe, surface,{" "}
            <code>scatter3D</code>, <code>bar3D</code>, <code>line3D</code>. Pass any
            ECharts-GL option object.
        </p>
    ),
    examples: [
        {
            name: "3D surface",
            description: "A classic 3D surface plot from the ECharts gallery, auto-rotating.",
            render: () => (
                <div className="h-72 w-full">
                    <EChart3D option={surfaceOption} />
                </div>
            ),
            code: `import { EChart3D } from "@particle-academy/fancy-echarts";

<EChart3D
    option={{
        grid3D: { viewControl: { autoRotate: true } },
        xAxis3D: { type: "value" },
        yAxis3D: { type: "value" },
        zAxis3D: { type: "value" },
        series: [{
            type: "surface",
            equation: { … },
        }],
    }}
/>`,
        },
        {
            name: "Globe (concept)",
            description: "Wire ECharts' `globe` component for cartographic visualizations.",
            render: () => (
                <div className="grid h-32 w-full place-items-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">
                    Globe requires real textures + data — see the ECharts globe demos for setup.
                </div>
            ),
            code: `<EChart3D
    option={{
        globe: {
            baseTexture: "/world-texture.jpg",
            heightTexture: "/world-height.jpg",
            shading: "lambert",
            light: { ambient: { intensity: 0.3 } },
        },
        series: [{ type: "scatter3D", coordinateSystem: "globe", data: points }],
    }}
/>`,
        },
    ],
    props: [
        { name: "option", type: `EChartsOption`, default: "—", description: "Standard ECharts option, including 3D series and `*Axis3D` / `grid3D` configs. Required." },
        { name: "theme", type: `string | object`, default: "—", description: "Theme name or object — same set as `EChart`." },
        { name: "onChartReady", type: `(chart: ECharts) => void`, default: "—", description: "Called once the chart is mounted." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root div." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles. Set width/height here." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Bundle:</strong> EChart3D pulls in <code>echarts-gl</code> on top of the
            base modules. Use the 2D <code>EChart</code> for 2D charts — keeps the bundle
            small.
        </p>
    ),
};
