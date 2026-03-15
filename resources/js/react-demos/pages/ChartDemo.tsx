import { Chart } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const barData = [
  { label: "Jan", value: 30 },
  { label: "Feb", value: 45 },
  { label: "Mar", value: 60 },
  { label: "Apr", value: 35 },
  { label: "May", value: 80 },
  { label: "Jun", value: 55 },
];

const donutData = [
  { label: "Desktop", value: 450, color: "#6366f1" },
  { label: "Mobile", value: 320, color: "#22c55e" },
  { label: "Tablet", value: 130, color: "#f59e0b" },
  { label: "Other", value: 50, color: "#ef4444" },
];

const pieData = [
  { label: "Engineering", value: 42, color: "#6366f1" },
  { label: "Marketing", value: 25, color: "#ec4899" },
  { label: "Sales", value: 18, color: "#14b8a6" },
  { label: "Design", value: 10, color: "#f97316" },
  { label: "Support", value: 5, color: "#8b5cf6" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const lineSeries = [
  { label: "Revenue", data: [12, 19, 14, 25, 22, 30], color: "#6366f1" },
];

const areaSeries = [
  { label: "Users", data: [200, 450, 380, 520, 610, 780], color: "#22c55e" },
];

const stackedSeries = [
  { label: "Organic", data: [20, 35, 30, 45, 40, 55], color: "#6366f1" },
  { label: "Paid", data: [15, 20, 25, 18, 30, 28], color: "#22c55e" },
  { label: "Referral", data: [8, 12, 10, 15, 12, 18], color: "#f59e0b" },
];

export function ChartDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Chart</h1>

      <DemoSection title="Bar Chart" description="Vertical bar chart with auto-scaling and value labels." code={`<Chart.Bar data={barData} height={200} showValues />`}>
        <div className="max-w-md">
          <Chart.Bar data={barData} height={200} showValues />
        </div>
      </DemoSection>

      <DemoSection title="Donut Chart" description="Proportional data visualization with legend." code={`<Chart.Donut data={donutData} />`}>
        <Chart.Donut data={donutData} />
      </DemoSection>

      <DemoSection title="Line Chart" description="Trend visualization with labeled axes." code={`<Chart.Line
  labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
  series={[{ label: "Revenue", data: [12, 19, 14, 25, 22, 30] }]}
/>`}>
        <div className="max-w-lg">
          <Chart.Line labels={months} series={lineSeries} />
        </div>
      </DemoSection>

      <DemoSection title="Area Chart" description="Filled area chart for volume or growth data." code={`<Chart.Area
  labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
  series={[{ label: "Users", data: [200, 450, 380, 520, 610, 780] }]}
/>`}>
        <div className="max-w-lg">
          <Chart.Area labels={months} series={areaSeries} />
        </div>
      </DemoSection>

      <DemoSection title="Pie Chart" description="Classic pie chart with segment labels." code={`<Chart.Pie data={pieData} showLabels />`}>
        <Chart.Pie data={pieData} showLabels />
      </DemoSection>

      <DemoSection title="Sparkline" description="Compact inline trend indicator." code={`<Chart.Sparkline data={[5, 10, 5, 20, 8, 15, 12, 25]} width={120} height={32} />`}>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">Revenue trend</span>
          <Chart.Sparkline data={[5, 10, 5, 20, 8, 15, 12, 25]} width={120} height={32} />
        </div>
      </DemoSection>

      <DemoSection title="Horizontal Bar Chart" description="Horizontal bars for category comparison." code={`<Chart.HorizontalBar data={barData} showValues />`}>
        <div className="max-w-md">
          <Chart.HorizontalBar data={barData} showValues />
        </div>
      </DemoSection>

      <DemoSection title="Stacked Bar Chart" description="Multi-series stacked bars for composition over time." code={`<Chart.StackedBar
  labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
  series={[
    { label: "Organic", data: [20, 35, 30, 45, 40, 55], color: "#6366f1" },
    { label: "Paid", data: [15, 20, 25, 18, 30, 28], color: "#22c55e" },
    { label: "Referral", data: [8, 12, 10, 15, 12, 18], color: "#f59e0b" },
  ]}
/>`}>
        <div className="max-w-lg">
          <Chart.StackedBar labels={months} series={stackedSeries} />
        </div>
      </DemoSection>
    </div>
  );
}
