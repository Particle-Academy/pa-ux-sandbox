import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";
import { useResizeObserver } from "./use-resize-observer";

export interface UseEChartsOptions {
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

export interface UseEChartsReturn {
  chartRef: RefObject<HTMLDivElement | null>;
  instance: ECharts | null;
}

/** Detect system dark mode preference reactively. */
function useDarkMode(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
}

export function useECharts(options: UseEChartsOptions): UseEChartsReturn {
  const {
    option,
    theme,
    renderer = "canvas",
    notMerge = false,
    lazyUpdate = false,
    showLoading = false,
    loadingOption,
    onEvents,
    autoResize = true,
  } = options;

  const isDark = useDarkMode();
  // Auto-detect theme: use explicit theme if provided, otherwise "dark" or undefined
  const autoDark = theme === undefined && isDark;
  const resolvedTheme = theme !== undefined ? theme : isDark ? "dark" : undefined;

  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<ECharts | null>(null);
  const [instance, setInstance] = useState<ECharts | null>(null);

  // Init/dispose — re-init when theme changes (including dark mode toggle)
  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose any existing instance (handles StrictMode double-mount)
    const existing = echarts.getInstanceByDom(chartRef.current);
    if (existing) {
      existing.dispose();
    }

    const chart = echarts.init(chartRef.current, resolvedTheme, { renderer });
    instanceRef.current = chart;
    setInstance(chart);

    return () => {
      chart.dispose();
      instanceRef.current = null;
      setInstance(null);
    };
  }, [resolvedTheme, renderer]);

  // Set option
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart || !option) return;
    // When using auto-detected dark theme, force transparent background
    // so charts blend with the page's own dark background
    const finalOption = autoDark
      ? { backgroundColor: "transparent", ...option }
      : option;
    chart.setOption(finalOption, { notMerge, lazyUpdate });
  }, [option, notMerge, lazyUpdate, autoDark]);

  // Loading state
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    if (showLoading) {
      chart.showLoading("default", loadingOption);
    } else {
      chart.hideLoading();
    }
  }, [showLoading, loadingOption]);

  // Event binding
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart || !onEvents) return;

    const entries = Object.entries(onEvents);
    for (const [event, handler] of entries) {
      chart.on(event, handler);
    }

    return () => {
      for (const [event, handler] of entries) {
        chart.off(event, handler);
      }
    };
  }, [onEvents]);

  // Auto-resize
  useResizeObserver(chartRef, () => {
    if (autoResize && instanceRef.current) {
      instanceRef.current.resize();
    }
  });

  return { chartRef, instance };
}
