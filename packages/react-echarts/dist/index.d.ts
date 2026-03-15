import React$1, { RefObject } from 'react';
import { EChartsOption, ECharts } from 'echarts';
export { ECharts as EChartsInstance, EChartsOption } from 'echarts';
import { LineChart, BarChart, PieChart, ScatterChart, RadarChart, HeatmapChart, GaugeChart, FunnelChart, TreemapChart, SunburstChart, SankeyChart, GraphChart, CandlestickChart, BoxplotChart, ParallelChart, ThemeRiverChart, MapChart, CustomChart, EffectScatterChart, PictorialBarChart } from 'echarts/charts';
export { BarChart, BoxplotChart, CandlestickChart, CustomChart, EffectScatterChart, FunnelChart, GaugeChart, GraphChart, HeatmapChart, LineChart, MapChart, ParallelChart, PictorialBarChart, PieChart, RadarChart, SankeyChart, ScatterChart, SunburstChart, ThemeRiverChart, TreemapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent, DataZoomComponent, ToolboxComponent, VisualMapComponent, GeoComponent, ParallelComponent, CalendarComponent, GraphicComponent, PolarComponent, RadarComponent, DatasetComponent, MarkLineComponent, MarkPointComponent, MarkAreaComponent, TimelineComponent, BrushComponent } from 'echarts/components';
export { CalendarComponent, DataZoomComponent, DatasetComponent, GeoComponent, GraphicComponent, GridComponent, LegendComponent, PolarComponent, TitleComponent, ToolboxComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
export { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

interface EChartBaseProps {
    option: EChartsOption;
    theme?: string | object;
    renderer?: "canvas" | "svg";
    notMerge?: boolean;
    lazyUpdate?: boolean;
    showLoading?: boolean;
    loadingOption?: object;
    onEvents?: Record<string, (params: any) => void>;
    autoResize?: boolean;
}
interface SeriesComponentProps<T = any> extends Omit<EChartBaseProps, "option"> {
    data: T;
    title?: string;
    xAxis?: EChartsOption["xAxis"];
    yAxis?: EChartsOption["yAxis"];
    tooltip?: boolean | EChartsOption["tooltip"];
    legend?: boolean | EChartsOption["legend"];
    grid?: EChartsOption["grid"];
    seriesOptions?: Record<string, any>;
    option?: Partial<EChartsOption>;
}
interface ChartDivProps {
    style?: React.CSSProperties;
    className?: string;
}
type EChartComponentProps = EChartBaseProps & ChartDivProps & React.HTMLAttributes<HTMLDivElement>;

declare const EChart: React$1.ForwardRefExoticComponent<EChartBaseProps & ChartDivProps & React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>> & {
    Line: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Bar: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Pie: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Scatter: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Radar: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Heatmap: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Gauge: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Funnel: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Treemap: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Sunburst: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Sankey: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Graph: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Candlestick: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Boxplot: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Parallel: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    ThemeRiver: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Map: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Custom: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    EffectScatter: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    PictorialBar: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
};

declare const EChart3D: React$1.ForwardRefExoticComponent<EChartBaseProps & ChartDivProps & React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>> & {
    Bar: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Scatter: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Line: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Surface: React$1.FC<SeriesComponentProps<any> & ChartDivProps>;
    Globe: React$1.FC<Omit<SeriesComponentProps<any>, "data"> & ChartDivProps & {
        globe?: any;
        series?: any[];
    }>;
};

interface GraphicElement {
    type: "rect" | "circle" | "ring" | "arc" | "polygon" | "polyline" | "path" | "image" | "text" | "group";
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    shape?: Record<string, any>;
    style?: Record<string, any>;
    children?: GraphicElement[];
    onclick?: (e: any) => void;
    onmouseover?: (e: any) => void;
    onmouseout?: (e: any) => void;
    [key: string]: any;
}
interface EChartGraphicProps extends Omit<EChartBaseProps, "option">, ChartDivProps, React$1.HTMLAttributes<HTMLDivElement> {
    elements: GraphicElement[];
    option?: Partial<EChartsOption>;
}
/**
 * EChartGraphic — for custom drawing via ECharts graphic layer.
 * Supports rect, circle, ring, arc, polygon, polyline, path, image, text, group elements.
 */
declare const EChartGraphic: React$1.ForwardRefExoticComponent<EChartGraphicProps & React$1.RefAttributes<HTMLDivElement>>;

interface UseEChartsOptions {
    option: EChartsOption;
    theme?: string | object;
    renderer?: "canvas" | "svg";
    notMerge?: boolean;
    lazyUpdate?: boolean;
    showLoading?: boolean;
    loadingOption?: object;
    onEvents?: Record<string, (params: any) => void>;
    autoResize?: boolean;
}
interface UseEChartsReturn {
    chartRef: RefObject<HTMLDivElement | null>;
    instance: ECharts | null;
}
declare function useECharts(options: UseEChartsOptions): UseEChartsReturn;

declare function useResizeObserver(ref: RefObject<HTMLElement | null>, callback: () => void): void;

declare const allCharts: readonly [typeof LineChart, typeof BarChart, typeof PieChart, typeof ScatterChart, typeof RadarChart, typeof HeatmapChart, typeof GaugeChart, typeof FunnelChart, typeof TreemapChart, typeof SunburstChart, typeof SankeyChart, typeof GraphChart, typeof CandlestickChart, typeof BoxplotChart, typeof ParallelChart, typeof ThemeRiverChart, typeof MapChart, typeof CustomChart, typeof EffectScatterChart, typeof PictorialBarChart];
declare const allComponents: readonly [typeof GridComponent, typeof TooltipComponent, typeof TitleComponent, typeof LegendComponent, typeof DataZoomComponent, typeof ToolboxComponent, typeof VisualMapComponent, typeof GeoComponent, typeof ParallelComponent, typeof CalendarComponent, typeof GraphicComponent, typeof PolarComponent, typeof RadarComponent, typeof DatasetComponent, typeof MarkLineComponent, typeof MarkPointComponent, typeof MarkAreaComponent, typeof TimelineComponent, typeof BrushComponent];
/** Register all ECharts chart types, components, and renderers. Convenient for demos/quick starts. */
declare function registerAll(): void;
/** Register specific chart types by name for tree-shaking optimization. */
declare function registerCharts(...chartTypes: Array<(typeof allCharts)[number]>): void;
/** Register specific components by reference. */
declare function registerComponents(...components: Array<(typeof allComponents)[number]>): void;

/** Dark theme preset */
declare const darkTheme: {
    backgroundColor: string;
    textStyle: {
        color: string;
    };
    title: {
        textStyle: {
            color: string;
        };
    };
    legend: {
        textStyle: {
            color: string;
        };
    };
    categoryAxis: {
        axisLine: {
            lineStyle: {
                color: string;
            };
        };
        splitLine: {
            lineStyle: {
                color: string;
            };
        };
        axisLabel: {
            color: string;
        };
    };
    valueAxis: {
        axisLine: {
            lineStyle: {
                color: string;
            };
        };
        splitLine: {
            lineStyle: {
                color: string;
            };
        };
        axisLabel: {
            color: string;
        };
    };
    color: string[];
};
/** Vintage theme preset */
declare const vintageTheme: {
    color: string[];
    backgroundColor: string;
    textStyle: {};
    title: {
        textStyle: {
            color: string;
        };
    };
    categoryAxis: {
        axisLine: {
            lineStyle: {
                color: string;
            };
        };
        splitLine: {
            lineStyle: {
                color: string;
            };
        };
    };
    valueAxis: {
        axisLine: {
            lineStyle: {
                color: string;
            };
        };
        splitLine: {
            lineStyle: {
                color: string;
            };
        };
    };
};
/** Pastel theme preset */
declare const pastelTheme: {
    color: string[];
    backgroundColor: string;
    textStyle: {
        color: string;
    };
    title: {
        textStyle: {
            color: string;
        };
    };
};
/** Register a named theme with ECharts */
declare function registerTheme(name: string, theme: object): void;
/** Register all built-in theme presets */
declare function registerBuiltinThemes(): void;

export { type ChartDivProps, EChart, EChart3D, type EChartBaseProps, type EChartComponentProps, EChartGraphic, type EChartGraphicProps, type GraphicElement, type SeriesComponentProps, type UseEChartsOptions, type UseEChartsReturn, darkTheme, pastelTheme, registerAll, registerBuiltinThemes, registerCharts, registerComponents, registerTheme, useECharts, useResizeObserver, vintageTheme };
