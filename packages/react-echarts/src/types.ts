import type {
  EChartsOption,
  SetOptionOpts,
  ECharts as EChartsInstance,
} from "echarts";

export type { EChartsOption, SetOptionOpts, EChartsInstance };

export interface EChartBaseProps {
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

export interface SeriesComponentProps<T = any>
  extends Omit<EChartBaseProps, "option"> {
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

export interface ChartDivProps {
  style?: React.CSSProperties;
  className?: string;
}

export type EChartComponentProps = EChartBaseProps &
  ChartDivProps &
  React.HTMLAttributes<HTMLDivElement>;
