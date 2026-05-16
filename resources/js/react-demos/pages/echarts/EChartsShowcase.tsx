import { useState, useMemo, type ReactNode } from "react";
import { EChart } from "@particle-academy/fancy-echarts";
import {
  Tabs,
  Card,
  Badge,
  Action,
  Modal,
  ContextMenu,
  Popover,
  Toast,
  useToast,
  Progress,
  Icon,
} from "@particle-academy/react-fancy";

type Drilldown = { title: string; rows: { label: string; value: string }[] } | null;
type Tone = "success" | "warning" | "info";
const toneToColor: Record<Tone, "green" | "amber" | "blue"> = {
  success: "green",
  warning: "amber",
  info: "blue",
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const revenueByMonth = [42, 58, 51, 73, 89, 102, 118, 124, 131, 142, 156, 168];
const expenseByMonth = [35, 41, 44, 52, 60, 67, 74, 79, 81, 88, 92, 95];

const regions = [
  { name: "North America", value: 4820, growth: 12.4 },
  { name: "Europe", value: 3210, growth: 8.1 },
  { name: "Asia-Pacific", value: 2895, growth: 22.7 },
  { name: "Latin America", value: 1240, growth: 15.3 },
  { name: "Africa", value: 612, growth: 31.0 },
];

const categories = [
  { name: "Subscriptions", value: 5820 },
  { name: "Services",      value: 2410 },
  { name: "Hardware",      value: 1680 },
  { name: "Training",      value: 920 },
  { name: "Support",       value: 740 },
];

function activityData() {
  const hours = ["12a","3a","6a","9a","12p","3p","6p","9p"];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const data: [number, number, number][] = [];
  for (let d = 0; d < days.length; d++) {
    for (let h = 0; h < hours.length; h++) {
      const peak = h >= 3 && h <= 6 && d < 5 ? 1 : 0;
      data.push([h, d, Math.round(20 + Math.random() * 60 + peak * 80)]);
    }
  }
  return { hours, days, data };
}

const sankeyNodes = [
  { name: "Visitors" },
  { name: "Sign-ups" },
  { name: "Trial" },
  { name: "Churned" },
  { name: "Paid" },
  { name: "Annual" },
  { name: "Monthly" },
];
const sankeyLinks = [
  { source: "Visitors",  target: "Sign-ups", value: 4200 },
  { source: "Sign-ups",  target: "Trial",    value: 2800 },
  { source: "Sign-ups",  target: "Churned",  value: 1400 },
  { source: "Trial",     target: "Paid",     value: 1640 },
  { source: "Trial",     target: "Churned",  value: 1160 },
  { source: "Paid",      target: "Annual",   value: 720 },
  { source: "Paid",      target: "Monthly",  value: 920 },
];

function ShowcaseInner() {
  const { toast } = useToast();
  const [activity] = useState(activityData);
  const [drill, setDrill] = useState<Drilldown>(null);
  const [chartTheme, setChartTheme] = useState<"light" | "dark-preset">("light");

  const totalRevenue = revenueByMonth.reduce((a, b) => a + b, 0);
  const totalExpense = expenseByMonth.reduce((a, b) => a + b, 0);
  const margin = ((totalRevenue - totalExpense) / totalRevenue) * 100;

  const lineOption = useMemo(() => ({
    tooltip: { trigger: "axis" },
    legend: { data: ["Revenue", "Expenses"], top: 0 },
    grid: { left: 40, right: 20, top: 36, bottom: 28 },
    xAxis: { type: "category", data: months, boundaryGap: false },
    yAxis: { type: "value", axisLabel: { formatter: "${value}k" } },
    series: [
      {
        name: "Revenue", type: "line", smooth: true, data: revenueByMonth,
        areaStyle: { opacity: 0.18 }, lineStyle: { width: 3 },
        emphasis: { focus: "series" },
      },
      {
        name: "Expenses", type: "line", smooth: true, data: expenseByMonth,
        areaStyle: { opacity: 0.12 }, lineStyle: { width: 2, type: "dashed" },
      },
    ],
  }), []);

  const barOption = useMemo(() => ({
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const p = params[0];
        const region = regions.find((r) => r.name === p.name);
        const arrow = region && region.growth >= 0 ? "▲" : "▼";
        const color = region && region.growth >= 15 ? "#10b981" : "#3b82f6";
        return `<div style="font-weight:600">${p.name}</div>
                <div>Revenue: <b>$${p.value.toLocaleString()}k</b></div>
                <div style="color:${color}">${arrow} ${region?.growth}% YoY</div>
                <div style="font-size:11px;opacity:.6;margin-top:4px">Right-click chart for actions</div>`;
      },
    },
    grid: { left: 110, right: 30, top: 8, bottom: 28 },
    xAxis: { type: "value", axisLabel: { formatter: "${value}k" } },
    yAxis: { type: "category", data: regions.map((r) => r.name) },
    series: [{
      type: "bar",
      data: regions.map((r) => ({
        value: r.value,
        itemStyle: { color: r.growth >= 15 ? "#10b981" : "#3b82f6", borderRadius: [0, 6, 6, 0] },
      })),
      label: { show: true, position: "right", formatter: "${@[0]}k" },
    }],
  }), []);

  const pieOption = useMemo(() => ({
    tooltip: { trigger: "item", formatter: "{b}<br/>${c}k ({d}%)" },
    legend: { bottom: 0, type: "scroll" },
    series: [{
      type: "pie",
      radius: ["45%", "72%"],
      center: ["50%", "44%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
      label: { show: true, formatter: "{b}\n{d}%" },
      data: categories,
    }],
  }), []);

  const heatmapOption = useMemo(() => ({
    tooltip: {
      position: "top",
      formatter: (p: any) =>
        `${activity.days[p.value[1]]} · ${activity.hours[p.value[0]]}<br/><b>${p.value[2]}</b> active users`,
    },
    grid: { left: 50, right: 20, top: 12, bottom: 50 },
    xAxis: { type: "category", data: activity.hours, splitArea: { show: true } },
    yAxis: { type: "category", data: activity.days, splitArea: { show: true } },
    visualMap: {
      min: 0, max: 180, calculable: true, orient: "horizontal", left: "center", bottom: 0,
      inRange: { color: ["#dbeafe", "#3b82f6", "#1e40af"] },
    },
    series: [{ type: "heatmap", data: activity.data, label: { show: false } }],
  }), [activity]);

  const gaugeOption = useMemo(() => ({
    series: [{
      type: "gauge",
      startAngle: 200, endAngle: -20,
      min: 0, max: 100,
      progress: { show: true, width: 16 },
      axisLine: { lineStyle: { width: 16 } },
      pointer: { width: 4, length: "70%" },
      axisTick: { distance: -20, length: 6 },
      splitLine: { distance: -22, length: 14 },
      axisLabel: { distance: 18, fontSize: 10 },
      detail: { valueAnimation: true, formatter: "{value}%", fontSize: 28, offsetCenter: [0, "60%"] },
      data: [{ value: Math.round(margin), name: "Margin" }],
      title: { offsetCenter: [0, "85%"], fontSize: 12 },
    }],
  }), [margin]);

  const sankeyOption = useMemo(() => ({
    tooltip: { trigger: "item", triggerOn: "mousemove" },
    series: [{
      type: "sankey",
      data: sankeyNodes,
      links: sankeyLinks,
      emphasis: { focus: "adjacency" },
      lineStyle: { color: "gradient", curveness: 0.5 },
      label: { fontSize: 11 },
      nodeAlign: "left",
    }],
  }), []);

  const handleBarRightClick = (params: any) => {
    if (params.event?.event) params.event.event.preventDefault();
    const region = regions.find((r) => r.name === params.name);
    if (!region) return;
    setDrill({
      title: `${region.name} — drill-down`,
      rows: [
        { label: "Revenue (YTD)", value: `$${region.value.toLocaleString()}k` },
        { label: "YoY Growth", value: `${region.growth}%` },
        { label: "Active Customers", value: `${Math.round(region.value * 1.4)}` },
        { label: "Avg Deal Size", value: `$${(region.value / Math.max(1, region.growth) * 10).toFixed(0)}` },
      ],
    });
  };

  const handlePieClick = (params: any) => {
    toast({
      title: `${params.name} clicked`,
      description: `${params.percent}% of total revenue ($${params.value}k)`,
      variant: "info",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Dashboard — ECharts × react-fancy</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Six chart types wired up with Tabs, Cards, Badge, Modal, ContextMenu, Popover, Toast, and Progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={chartTheme === "dark-preset" ? "blue" : "green"}>
            {chartTheme === "dark-preset" ? "Dark theme" : "Light theme"}
          </Badge>
          <Action size="sm" onClick={() => setChartTheme((t) => (t === "light" ? "dark-preset" : "light"))}>
            Toggle theme
          </Action>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Revenue (YTD)" value={`$${totalRevenue}k`} delta="+18.2%" tone="success" />
        <KpiCard label="Expenses" value={`$${totalExpense}k`} delta="+9.4%" tone="warning" />
        <KpiCard label="Margin" value={`${margin.toFixed(1)}%`} delta="+2.1pp" tone="info" />
        <KpiCard label="Active Customers" value="12,840" delta="+412" tone="success" />
      </div>

      <Tabs defaultTab="overview" variant="underline">
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="regions">Regions</Tabs.Tab>
          <Tabs.Tab value="activity">Activity</Tabs.Tab>
          <Tabs.Tab value="funnel">Funnel</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panels>
          <Tabs.Panel value="overview">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ChartFrame
                className="lg:col-span-2"
                title="Revenue vs Expenses"
                info="Revenue is up 18% YoY while expenses grew only 9%, expanding margin by 2.1pp. December set a new monthly high."
                onExport={() => toast({ title: "Line CSV exported", variant: "success" })}
                actions={[
                  { label: "Compare YoY", onClick: () => toast({ title: "YoY overlay added", variant: "info" }) },
                ]}
              >
                <EChart theme={chartTheme} option={lineOption} style={{ height: 320 }} />
              </ChartFrame>

              <ChartFrame
                title="Operating margin"
                badge={{ color: margin >= 30 ? "green" : "amber", label: margin >= 30 ? "Healthy" : "Watch" }}
                info="Operating margin = (Revenue − Expenses) / Revenue. Above 30% is healthy for our segment."
                onExport={() => toast({ title: "Margin snapshot copied", variant: "success" })}
                actions={[
                  { label: "Forecast", onClick: () => toast({ title: "Forecast running…", variant: "info" }) },
                ]}
              >
                <EChart theme={chartTheme} option={gaugeOption} style={{ height: 320 }} />
              </ChartFrame>

              <ChartFrame
                className="lg:col-span-3"
                title="Revenue by category"
                info="Click any slice for a toast with that category's share. Subscriptions remain the dominant revenue stream."
                onExport={() => toast({ title: "Category breakdown exported", variant: "success" })}
                actions={[
                  { label: "Open report", onClick: () => setDrill({
                    title: "Category report",
                    rows: categories.map((c) => ({ label: c.name, value: `$${c.value}k` })),
                  }) },
                ]}
              >
                <EChart
                  theme={chartTheme}
                  option={pieOption}
                  onEvents={{ click: handlePieClick }}
                  style={{ height: 360 }}
                />
              </ChartFrame>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="regions">
            <ChartFrame
              title="Regional revenue"
              badge={{ color: "blue", label: `${regions.length} regions` }}
              info="Right-click the chart for export/sort actions. Right-click a specific bar to open its drill-down modal."
              onExport={() => toast({ title: "Region CSV exported", variant: "success" })}
              extraMenu={
                <>
                  <ContextMenu.Sub>
                    <ContextMenu.SubTrigger>Sort by</ContextMenu.SubTrigger>
                    <ContextMenu.SubContent>
                      <ContextMenu.Item onClick={() => toast({ title: "Sorted by revenue" })}>Revenue</ContextMenu.Item>
                      <ContextMenu.Item onClick={() => toast({ title: "Sorted by growth" })}>Growth</ContextMenu.Item>
                    </ContextMenu.SubContent>
                  </ContextMenu.Sub>
                </>
              }
              actions={[
                { label: "Top region", onClick: () => {
                  const top = [...regions].sort((a, b) => b.value - a.value)[0];
                  setDrill({
                    title: `${top.name} — drill-down`,
                    rows: [
                      { label: "Revenue (YTD)", value: `$${top.value.toLocaleString()}k` },
                      { label: "YoY Growth", value: `${top.growth}%` },
                    ],
                  });
                } },
              ]}
            >
              <EChart
                theme={chartTheme}
                option={barOption}
                onEvents={{ contextmenu: handleBarRightClick }}
                style={{ height: 360 }}
              />

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                {regions.map((r) => (
                  <div key={r.name} className="rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-700">
                    <div className="font-medium">{r.name}</div>
                    <Progress value={Math.min(100, r.growth * 3)} className="my-1.5" />
                    <div className="text-zinc-500">+{r.growth}% YoY</div>
                  </div>
                ))}
              </div>
            </ChartFrame>
          </Tabs.Panel>

          <Tabs.Panel value="activity">
            <ChartFrame
              title="User activity heatmap"
              badge={{ color: "blue", label: "Last 7 days" }}
              info="Hours of day × days of week. Brightest cells = peak engagement. Weekday afternoons (3p–6p) are the heaviest window."
              onExport={() => toast({ title: "Heatmap PNG exported", variant: "success" })}
              actions={[
                { label: "Refresh", onClick: () => toast({ title: "Activity refreshed", variant: "success" }) },
              ]}
              extraMenu={
                <>
                  <ContextMenu.Sub>
                    <ContextMenu.SubTrigger>Time range</ContextMenu.SubTrigger>
                    <ContextMenu.SubContent>
                      <ContextMenu.Item onClick={() => toast({ title: "Range: 24h" })}>24 hours</ContextMenu.Item>
                      <ContextMenu.Item onClick={() => toast({ title: "Range: 7d" })}>7 days</ContextMenu.Item>
                      <ContextMenu.Item onClick={() => toast({ title: "Range: 30d" })}>30 days</ContextMenu.Item>
                    </ContextMenu.SubContent>
                  </ContextMenu.Sub>
                </>
              }
            >
              <EChart theme={chartTheme} option={heatmapOption} style={{ height: 380 }} />
            </ChartFrame>
          </Tabs.Panel>

          <Tabs.Panel value="funnel">
            <ChartFrame
              title="Conversion funnel"
              info="Sankey diagram showing how visitors flow from landing through trial into paid plans. Hover a band to highlight the connected segments."
              onExport={() => toast({ title: "Funnel CSV exported", variant: "success" })}
              actions={[
                { label: "Recompute", onClick: () => toast({ title: "Funnel recomputed", variant: "info" }) },
              ]}
              extraMenu={
                <>
                  <ContextMenu.Item onClick={() => toast({ title: "Annotation added" })}>
                    Add annotation
                  </ContextMenu.Item>
                </>
              }
            >
              <EChart theme={chartTheme} option={sankeyOption} style={{ height: 380 }} />
            </ChartFrame>
          </Tabs.Panel>
        </Tabs.Panels>
      </Tabs>

      <Modal open={drill !== null} onClose={() => setDrill(null)} size="md">
        <Modal.Header>
          <h2 className="text-lg font-semibold">{drill?.title}</h2>
        </Modal.Header>
        <Modal.Body>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {drill?.rows.map((row) => (
              <div key={row.label} className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-end gap-2">
            <Action size="sm" onClick={() => setDrill(null)}>Close</Action>
            <Action
              size="sm"
              onClick={() => {
                toast({ title: "Report queued", description: "We'll email you when it's ready.", variant: "success" });
                setDrill(null);
              }}
            >
              Generate report
            </Action>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

type ChartFrameAction = { label: string; onClick: () => void };

function ChartFrame({
  title,
  info,
  badge,
  actions = [],
  onExport,
  extraMenu,
  className,
  children,
}: {
  title: string;
  info: string;
  badge?: { color: "zinc" | "red" | "blue" | "green" | "amber" | "violet" | "rose"; label: string };
  actions?: ChartFrameAction[];
  onExport?: () => void;
  extraMenu?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const { toast } = useToast();
  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <Popover hover placement="right">
              <Popover.Trigger>
                <button className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800">
                  <Icon name="info" size="sm" />
                </button>
              </Popover.Trigger>
              <Popover.Content>
                <div className="w-64 text-sm">
                  <div className="mb-1 font-semibold">{title}</div>
                  <p className="text-zinc-500">{info}</p>
                </div>
              </Popover.Content>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            {badge && <Badge color={badge.color}>{badge.label}</Badge>}
            {actions.map((a) => (
              <Action key={a.label} size="sm" onClick={a.onClick}>{a.label}</Action>
            ))}
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <ContextMenu>
          <ContextMenu.Trigger>
            <div>{children}</div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item onClick={() => (onExport ? onExport() : toast({ title: "Exported CSV", variant: "success" }))}>
              Export CSV
            </ContextMenu.Item>
            <ContextMenu.Item onClick={() => toast({ title: "Exported PNG", variant: "success" })}>
              Export PNG
            </ContextMenu.Item>
            <ContextMenu.Item onClick={() => toast({ title: "Copied to clipboard", variant: "success" })}>
              Copy data
            </ContextMenu.Item>
            {extraMenu && <ContextMenu.Separator />}
            {extraMenu}
            <ContextMenu.Separator />
            <ContextMenu.Item onClick={() => toast({ title: "Refreshed", variant: "info" })}>
              Refresh
            </ContextMenu.Item>
            <ContextMenu.Item danger onClick={() => toast({ title: "Reset", variant: "warning" })}>
              Reset
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      </Card.Body>
    </Card>
  );
}

function KpiCard({ label, value, delta, tone }: {
  label: string;
  value: string;
  delta: string;
  tone: Tone;
}) {
  return (
    <Card>
      <Card.Body>
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        <Badge color={toneToColor[tone]} className="mt-2">{delta}</Badge>
      </Card.Body>
    </Card>
  );
}

export function EChartsShowcase() {
  return (
    <Toast.Provider position="bottom-right">
      <ShowcaseInner />
    </Toast.Provider>
  );
}
