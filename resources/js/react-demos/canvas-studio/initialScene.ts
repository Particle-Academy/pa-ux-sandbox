import type { Scene } from "@particle-academy/fancy-3d";

export const initialScene: Scene = {
  nodes: [
    {
      id: "kpi-revenue",
      position: { x: 60, y: 60 },
      size: { w: 220, h: 110 },
      widget: { kind: "kpi", label: "Monthly Revenue", value: "$48.2k", delta: "+12.4%", trend: "up" },
    },
    {
      id: "kpi-users",
      position: { x: 300, y: 60 },
      size: { w: 220, h: 110 },
      widget: { kind: "kpi", label: "Active Users", value: "12,847", delta: "+3.1%", trend: "up" },
    },
    {
      id: "kpi-churn",
      position: { x: 540, y: 60 },
      size: { w: 220, h: 110 },
      widget: { kind: "kpi", label: "Churn Rate", value: "2.1%", delta: "-0.4%", trend: "down" },
    },
    {
      id: "chart-revenue",
      position: { x: 60, y: 200 },
      size: { w: 460, h: 220 },
      widget: {
        kind: "chart",
        title: "Revenue trend",
        variant: "area",
        series: [12, 18, 14, 22, 28, 24, 32, 38, 34, 44, 48, 52],
        color: "#6366f1",
      },
    },
    {
      id: "chart-signups",
      position: { x: 540, y: 200 },
      size: { w: 280, h: 220 },
      widget: {
        kind: "chart",
        title: "Signups",
        variant: "bar",
        series: [4, 7, 9, 6, 11, 14, 12],
        color: "#10b981",
      },
    },
    {
      id: "kanban",
      position: { x: 60, y: 460 },
      size: { w: 460, h: 280 },
      widget: {
        kind: "kanban",
        columns: [
          { title: "Todo", cards: ["Auth flow", "Onboarding"] },
          { title: "Doing", cards: ["Billing"] },
          { title: "Done", cards: ["Setup", "Schema"] },
        ],
      },
    },
    {
      id: "table-orders",
      position: { x: 540, y: 460 },
      size: { w: 360, h: 280 },
      widget: {
        kind: "table",
        title: "Recent orders",
        columns: ["ID", "Customer", "Total"],
        rows: [
          ["#1024", "Acme Co", "$1,200"],
          ["#1025", "Initech", "$340"],
          ["#1026", "Wonka", "$890"],
          ["#1027", "Stark", "$5,440"],
        ],
      },
    },
    {
      id: "profile",
      position: { x: 920, y: 60 },
      size: { w: 240, h: 110 },
      widget: { kind: "profile", name: "Glenn Born", role: "Founder", initials: "GB", status: "online" },
    },
    {
      id: "callout",
      position: { x: 920, y: 200 },
      size: { w: 280, h: 130 },
      widget: {
        kind: "callout",
        tone: "warning",
        title: "Stripe webhook latency",
        body: "P95 latency rose to 1.4s in the last hour.",
      },
    },
    {
      id: "form",
      position: { x: 920, y: 360 },
      size: { w: 280, h: 220 },
      widget: {
        kind: "form",
        title: "Settings",
        fields: [
          { id: "name", label: "Project name", type: "text" },
          { id: "limit", label: "Rate limit", type: "number" },
          { id: "live", label: "Live mode", type: "switch" },
        ],
      },
    },
    {
      id: "actions",
      position: { x: 920, y: 600 },
      size: { w: 280, h: 110 },
      widget: {
        kind: "action",
        title: "Quick actions",
        buttons: [
          { label: "Deploy", variant: "primary" },
          { label: "Roll back", variant: "secondary" },
          { label: "Logs", variant: "ghost" },
        ],
      },
    },
    {
      id: "timeline",
      position: { x: 60, y: 780 },
      size: { w: 360, h: 220 },
      widget: {
        kind: "timeline",
        title: "Activity",
        events: [
          { at: "10:42", label: "Deploy succeeded" },
          { at: "10:31", label: "Build passed" },
          { at: "10:18", label: "PR #482 merged" },
          { at: "09:55", label: "Migration applied" },
        ],
      },
    },
    {
      id: "code",
      position: { x: 440, y: 780 },
      size: { w: 460, h: 220 },
      widget: {
        kind: "code",
        title: "Webhook handler",
        language: "ts",
        code: "export async function handle(req: Request) {\n  const event = await stripe.webhooks.constructEvent(\n    req.body, req.headers['stripe-signature'], SECRET\n  );\n  await dispatch(event);\n  return new Response('ok');\n}",
      },
    },
  ],
  edges: [
    { id: "e1", from: "kpi-revenue", to: "chart-revenue", curve: "bezier" },
    { id: "e2", from: "kpi-users", to: "chart-revenue", curve: "bezier" },
    { id: "e3", from: "kpi-churn", to: "chart-signups", curve: "bezier" },
    { id: "e4", from: "chart-revenue", to: "kanban", curve: "step", animated: true },
    { id: "e5", from: "chart-signups", to: "table-orders", curve: "step", animated: true },
    { id: "e6", from: "callout", to: "actions", curve: "bezier", label: "auto-mitigate" },
  ],
};
