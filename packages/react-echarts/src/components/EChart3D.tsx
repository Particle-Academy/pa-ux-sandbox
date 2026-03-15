import React, { forwardRef, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { useECharts } from "../hooks/use-echarts";
import type {
  EChartComponentProps,
  SeriesComponentProps,
  ChartDivProps,
} from "../types";

const DEFAULT_STYLE: React.CSSProperties = { width: "100%", height: 500 };

let glLoaded = false;
let glPromise: Promise<void> | null = null;

function loadEChartsGL(): Promise<void> {
  if (glLoaded) return Promise.resolve();
  if (!glPromise) {
    glPromise = import("echarts-gl")
      .then(() => {
        glLoaded = true;
      })
      .catch(() => {
        console.warn(
          "echarts-gl is required for 3D charts. Install it with: npm install echarts-gl"
        );
      });
  }
  return glPromise;
}

/** Wrapper that delays mount until echarts-gl is loaded */
function WithGL({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [ready, setReady] = useState(glLoaded);

  useEffect(() => {
    if (glLoaded) {
      setReady(true);
      return;
    }
    loadEChartsGL().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ ...DEFAULT_STYLE, ...style, display: "flex", alignItems: "center", justifyContent: "center" }} className={className}>
        <span style={{ color: "#9ca3af", fontSize: 14 }}>Loading 3D engine...</span>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * EChart3D — 3D chart component that loads echarts-gl.
 * Requires `echarts-gl` to be installed as a peer dependency.
 */
const EChart3DInner = forwardRef<HTMLDivElement, EChartComponentProps>(
  (
    {
      option,
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize = true,
      style,
      className,
      ...rest
    },
    _ref
  ) => {
    const { chartRef } = useECharts({
      option,
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize,
    });

    return (
      <div
        ref={chartRef}
        style={{ ...DEFAULT_STYLE, ...style }}
        className={className}
        {...rest}
      />
    );
  }
);

EChart3DInner.displayName = "EChart3DInner";

const EChart3DBase = forwardRef<HTMLDivElement, EChartComponentProps>(
  (props, ref) => {
    const { style, className, ...rest } = props;
    return (
      <WithGL style={style} className={className}>
        <EChart3DInner ref={ref} style={style} className={className} {...rest} />
      </WithGL>
    );
  }
);

EChart3DBase.displayName = "EChart3D";

function create3DSeriesComponent(
  seriesType: string,
  displayName: string
): React.FC<SeriesComponentProps & ChartDivProps> {
  const Component: React.FC<SeriesComponentProps & ChartDivProps> = ({
    data,
    title,
    tooltip = true,
    seriesOptions = {},
    option: extraOption = {},
    style,
    className,
    ...rest
  }) => {
    const option = useMemo((): EChartsOption => {
      const base: any = {};

      if (title) {
        base.title = { text: title };
      }

      if (tooltip === true) {
        base.tooltip = {};
      } else if (tooltip && typeof tooltip === "object") {
        base.tooltip = tooltip;
      }

      if (["bar3D", "scatter3D", "line3D", "surface"].includes(seriesType)) {
        base.xAxis3D = { type: "value" };
        base.yAxis3D = { type: "value" };
        base.zAxis3D = { type: "value" };
        base.grid3D = {};
      }

      base.series = [{ type: seriesType, data, ...seriesOptions }];

      return { ...base, ...extraOption } as EChartsOption;
    }, [data, title, tooltip, seriesOptions, extraOption]);

    return (
      <EChart3DBase
        option={option}
        style={style}
        className={className}
        {...rest}
      />
    );
  };

  Component.displayName = displayName;
  return Component;
}

function createGlobeComponent(): React.FC<
  Omit<SeriesComponentProps, "data"> &
    ChartDivProps & { globe?: any; series?: any[] }
> {
  const Component: React.FC<
    Omit<SeriesComponentProps, "data"> &
      ChartDivProps & { globe?: any; series?: any[] }
  > = ({
    title,
    globe,
    series = [],
    option: extraOption = {},
    style,
    className,
    ...rest
  }) => {
    const option = useMemo((): EChartsOption => {
      const base: any = {};

      if (title) {
        base.title = { text: title };
      }

      base.globe = globe ?? {
        baseTexture: "",
        shading: "lambert",
        atmosphere: { show: true },
      };

      if (series.length > 0) {
        base.series = series;
      }

      return { ...base, ...extraOption } as EChartsOption;
    }, [title, globe, series, extraOption]);

    return (
      <EChart3DBase
        option={option}
        style={style}
        className={className}
        {...rest}
      />
    );
  };

  Component.displayName = "EChart3D.Globe";
  return Component;
}

export const EChart3D = Object.assign(EChart3DBase, {
  Bar: create3DSeriesComponent("bar3D", "EChart3D.Bar"),
  Scatter: create3DSeriesComponent("scatter3D", "EChart3D.Scatter"),
  Line: create3DSeriesComponent("line3D", "EChart3D.Line"),
  Surface: create3DSeriesComponent("surface", "EChart3D.Surface"),
  Globe: createGlobeComponent(),
});
