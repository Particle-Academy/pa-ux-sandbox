import { useState } from "react";
import { Action, Badge, Card, Tabs, Text } from "@particle-academy/react-fancy";
import {
    DataDiagram,
    Flowchart,
    Mindmap,
    OrgChart,
    type FlowchartNode,
    type FlowchartEdge,
    type MindmapNode,
    type OrgChartNode,
} from "@particle-academy/fancy-echarts";
import { Download, Maximize2 } from "lucide-react";

type Diagram = "flowchart" | "mindmap" | "orgchart" | "datadiagram";

export function DiagramStudioKit() {
    const [diagram, setDiagram] = useState<Diagram>("datadiagram");

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <Card.Body className="!p-0">
                <Tabs activeTab={diagram} onTabChange={(v) => setDiagram(v as Diagram)}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 pt-3 dark:border-zinc-800">
                        <Tabs.List>
                            <Tabs.Tab value="datadiagram">Data diagram</Tabs.Tab>
                            <Tabs.Tab value="orgchart">Org chart</Tabs.Tab>
                            <Tabs.Tab value="flowchart">Flowchart</Tabs.Tab>
                            <Tabs.Tab value="mindmap">Mindmap</Tabs.Tab>
                        </Tabs.List>
                        <div className="flex items-center gap-2 pb-3">
                            <Badge color="violet" size="sm">{KITS[diagram].label}</Badge>
                            <Text size="xs" className="!font-mono !text-zinc-500">{KITS[diagram].component}</Text>
                            <Action variant="ghost" size="sm" aria-label="Fullscreen">
                                <Maximize2 size={14} />
                            </Action>
                            <Action variant="ghost" size="sm" aria-label="Download">
                                <Download size={14} />
                            </Action>
                        </div>
                    </div>
                    <Tabs.Panels>
                        <Tabs.Panel value="datadiagram"><DataDiagramDemo /></Tabs.Panel>
                        <Tabs.Panel value="orgchart"><OrgChartDemo /></Tabs.Panel>
                        <Tabs.Panel value="flowchart"><FlowchartDemo /></Tabs.Panel>
                        <Tabs.Panel value="mindmap"><MindmapDemo /></Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <Text size="xs" className="!text-zinc-500">
                        {KITS[diagram].caption}
                    </Text>
                    <Text size="xs" className="!font-mono !text-zinc-500">
                        @particle-academy/fancy-echarts
                    </Text>
                </div>
            </Card.Body>
        </div>
    );
}

const KITS: Record<Diagram, { label: string; component: string; caption: string }> = {
    datadiagram: {
        label: "ERD preset",
        component: "<DataDiagram>",
        caption: "Entity-Relationship diagram with manhattan-routed connectors, primary + foreign key markers, multiplicity labels.",
    },
    orgchart: {
        label: "Top-down hierarchy",
        component: "<OrgChart>",
        caption: "Auto-laid-out org tree. Children centered under parents; UML-style open triangle on the child end.",
    },
    flowchart: {
        label: "Workflow graph",
        component: "<Flowchart>",
        caption: "Process flow with manhattan routing, arrowheads, and optional edge labels. Positions are explicit per node.",
    },
    mindmap: {
        label: "Radial layout",
        component: "<Mindmap>",
        caption: "Radial mindmap. Root at center; children fan outward on concentric rings; angular wedges sized by subtree leaf count.",
    },
};

// ─── Data diagram (ERD) ───────────────────────────────────────────────────

const erdSchema = {
    entities: [
        {
            name: "Users",
            fields: [
                { name: "id", type: "bigint", primary: true },
                { name: "email", type: "varchar(255)" },
                { name: "name", type: "varchar(255)" },
                { name: "created_at", type: "timestamp" },
            ],
        },
        {
            name: "Orgs",
            fields: [
                { name: "id", type: "bigint", primary: true },
                { name: "slug", type: "varchar(64)" },
                { name: "plan", type: "varchar(32)" },
            ],
        },
        {
            name: "Memberships",
            fields: [
                { name: "id", type: "bigint", primary: true },
                { name: "user_id", type: "bigint", foreign: true },
                { name: "org_id", type: "bigint", foreign: true },
                { name: "role", type: "varchar(32)" },
            ],
        },
        {
            name: "Audits",
            fields: [
                { name: "id", type: "bigint", primary: true },
                { name: "org_id", type: "bigint", foreign: true },
                { name: "event", type: "varchar(64)" },
                { name: "at", type: "timestamp" },
            ],
        },
    ],
    relations: [
        { from: "Users", to: "Memberships", type: "one-to-many" as const },
        { from: "Orgs", to: "Memberships", type: "one-to-many" as const },
        { from: "Orgs", to: "Audits", type: "one-to-many" as const },
    ],
};

function DataDiagramDemo() {
    return (
        <div className="h-[440px]">
            <DataDiagram schema={erdSchema} />
        </div>
    );
}

// ─── Org chart ────────────────────────────────────────────────────────────

const orgRoot: OrgChartNode = {
    id: "founder",
    label: "Founder",
    color: "#8b5cf6",
    children: [
        {
            id: "design",
            label: "Design",
            color: "#6366f1",
            children: [
                { id: "visual", label: "Visual", color: "#f59e0b" },
                { id: "product", label: "Product", color: "#f59e0b" },
                { id: "research", label: "Research", color: "#f59e0b" },
            ],
        },
        {
            id: "engineering",
            label: "Engineering",
            color: "#6366f1",
            children: [
                { id: "platform", label: "Platform", color: "#10b981" },
                { id: "fullstack", label: "Full-stack", color: "#10b981" },
                { id: "infra", label: "Infrastructure", color: "#10b981" },
                { id: "qa", label: "QA", color: "#10b981" },
            ],
        },
        {
            id: "gtm",
            label: "GTM",
            color: "#6366f1",
            children: [
                { id: "sales", label: "Sales", color: "#06b6d4" },
                { id: "marketing", label: "Marketing", color: "#06b6d4" },
                { id: "success", label: "Customer Success", color: "#06b6d4" },
            ],
        },
    ],
};

function OrgChartDemo() {
    return (
        <div className="h-[440px]">
            <OrgChart root={orgRoot} />
        </div>
    );
}

// ─── Flowchart ────────────────────────────────────────────────────────────

const flowNodes: FlowchartNode[] = [
    { id: "intake", label: "Customer asks", x: 40, y: 60, color: "#0ea5e9" },
    { id: "classify", label: "Classify intent", x: 280, y: 60, color: "#8b5cf6" },
    { id: "fetch", label: "Fetch records", x: 520, y: 60 },
    { id: "draft", label: "LLM draft reply", x: 520, y: 200, color: "#10b981" },
    { id: "approve", label: "Human approves", x: 520, y: 340, color: "#f59e0b" },
    { id: "send", label: "Send response", x: 760, y: 270, color: "#8b5cf6" },
    { id: "log", label: "Log to CRM", x: 760, y: 60 },
];

const flowEdges: FlowchartEdge[] = [
    { from: "intake", to: "classify" },
    { from: "classify", to: "fetch" },
    { from: "fetch", to: "draft", label: "context" },
    { from: "draft", to: "approve" },
    { from: "approve", to: "send", label: "✓" },
    { from: "send", to: "log" },
    { from: "fetch", to: "log", label: "tag" },
];

function FlowchartDemo() {
    return (
        <div className="h-[440px]">
            <Flowchart nodes={flowNodes} edges={flowEdges} routing="manhattan" />
        </div>
    );
}

// ─── Mindmap ──────────────────────────────────────────────────────────────

const mindRoot: MindmapNode = {
    id: "humanplus",
    label: "Human+ UX",
    color: "#8b5cf6",
    children: [
        {
            id: "authorable",
            label: "Authorable",
            color: "#10b981",
            children: [
                { id: "terse", label: "Terse props", color: "#10b981" },
                { id: "typed", label: "Typed", color: "#10b981" },
                { id: "json", label: "JSON-friendly", color: "#10b981" },
            ],
        },
        {
            id: "inhabitable",
            label: "Inhabitable",
            color: "#10b981",
            children: [
                { id: "controlled", label: "Controlled state", color: "#10b981" },
                { id: "handles", label: "Stable handles", color: "#10b981" },
            ],
        },
        {
            id: "bridges",
            label: "MCP bridges",
            color: "#06b6d4",
            children: [
                { id: "whiteboard", label: "whiteboard_*", color: "#06b6d4" },
                { id: "flow", label: "flow_*", color: "#06b6d4" },
                { id: "sheets", label: "sheet_*", color: "#06b6d4" },
            ],
        },
        {
            id: "presence",
            label: "Presence",
            color: "#06b6d4",
            children: [
                { id: "cursors", label: "Agent cursors", color: "#06b6d4" },
                { id: "activity", label: "Activity feed", color: "#06b6d4" },
            ],
        },
        {
            id: "undo",
            label: "Undo",
            color: "#06b6d4",
        },
    ],
};

function MindmapDemo() {
    return (
        <div className="h-[440px]">
            <Mindmap root={mindRoot} />
        </div>
    );
}
