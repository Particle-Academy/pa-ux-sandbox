import { useState } from "react";
import { Action, Card, Heading, Tabs, Text } from "@particle-academy/react-fancy";

type Diagram = "flowchart" | "mindmap" | "orgchart" | "datadiagram";

export function DiagramStudioKit() {
    const [diagram, setDiagram] = useState<Diagram>("flowchart");

    return (
        <div className="space-y-3">
            <Card>
                <Card.Body className="p-0">
                    <Tabs activeTab={diagram} onTabChange={(v) => setDiagram(v as Diagram)}>
                        <Tabs.List className="border-b border-zinc-200 px-4 dark:border-zinc-800">
                            <Tabs.Tab value="flowchart">Flowchart</Tabs.Tab>
                            <Tabs.Tab value="mindmap">Mindmap</Tabs.Tab>
                            <Tabs.Tab value="orgchart">Org chart</Tabs.Tab>
                            <Tabs.Tab value="datadiagram">Data diagram</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="flowchart"><Flowchart /></Tabs.Panel>
                            <Tabs.Panel value="mindmap"><Mindmap /></Tabs.Panel>
                            <Tabs.Panel value="orgchart"><OrgChart /></Tabs.Panel>
                            <Tabs.Panel value="datadiagram"><DataDiagram /></Tabs.Panel>
                        </Tabs.Panels>
                    </Tabs>
                </Card.Body>
            </Card>
            <Text size="xs" className="!text-zinc-500">
                Each tab mirrors a preset from <code className="font-mono">@particle-academy/fancy-echarts</code> — schema-driven, all rendered through the same routing engine.
            </Text>
        </div>
    );
}

function Frame({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative h-[320px] bg-zinc-50 dark:bg-zinc-950">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(120,120,120,0.18) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            />
            {children}
        </div>
    );
}

function Box({ x, y, w = 130, label, tone = "violet" }: { x: number; y: number; w?: number; label: string; tone?: "violet" | "sky" | "emerald" | "amber" }) {
    const tones = {
        violet: "border-violet-400 bg-violet-50 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100",
        sky: "border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-500/15 dark:text-sky-100",
        emerald: "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100",
        amber: "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100",
    };
    return (
        <div
            className={`absolute rounded-md border px-3 py-1.5 text-center text-xs font-medium shadow-sm ${tones[tone]}`}
            style={{ left: x, top: y, width: w }}
        >
            {label}
        </div>
    );
}

function Line({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    const mx = (x1 + x2) / 2;
    return (
        <path
            d={`M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            stroke="rgba(124,58,237,0.55)"
            strokeWidth={1.5}
            fill="none"
        />
    );
}

function Flowchart() {
    return (
        <Frame>
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
                <Line x1={130} y1={75} x2={210} y2={75} />
                <Line x1={340} y1={75} x2={420} y2={75} />
                <Line x1={485} y1={105} x2={485} y2={155} />
                <Line x1={485} y1={195} x2={485} y2={245} />
                <Line x1={550} y1={185} x2={620} y2={185} />
            </svg>
            <Box x={20}  y={60}  label="Customer asks" tone="sky" />
            <Box x={210} y={60}  label="Classify intent" tone="violet" />
            <Box x={420} y={60}  label="Fetch records" />
            <Box x={420} y={155} label="LLM draft reply" tone="emerald" />
            <Box x={420} y={240} label="Human approves" tone="amber" />
            <Box x={620} y={170} label="Send" tone="violet" />
        </Frame>
    );
}

function Mindmap() {
    return (
        <Frame>
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
                <Line x1={355} y1={155} x2={130} y2={70} />
                <Line x1={355} y1={155} x2={130} y2={170} />
                <Line x1={355} y1={155} x2={130} y2={250} />
                <Line x1={485} y1={155} x2={680} y2={70} />
                <Line x1={485} y1={155} x2={680} y2={170} />
                <Line x1={485} y1={155} x2={680} y2={250} />
            </svg>
            <Box x={345} y={140} w={130} label="Human+ UX" tone="violet" />
            <Box x={20}  y={55}  label="Authorable" tone="emerald" />
            <Box x={20}  y={155} label="Inhabitable" tone="emerald" />
            <Box x={20}  y={235} label="Composable" tone="emerald" />
            <Box x={680} y={55}  label="Bridges" tone="sky" />
            <Box x={680} y={155} label="Presence" tone="sky" />
            <Box x={680} y={235} label="Undo" tone="sky" />
        </Frame>
    );
}

function OrgChart() {
    return (
        <Frame>
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
                <Line x1={420} y1={75}  x2={140} y2={175} />
                <Line x1={420} y1={75}  x2={420} y2={175} />
                <Line x1={420} y1={75}  x2={700} y2={175} />
                <Line x1={140} y1={205} x2={60}  y2={265} />
                <Line x1={140} y1={205} x2={220} y2={265} />
            </svg>
            <Box x={355} y={60}  label="Founder" tone="violet" />
            <Box x={75}  y={160} label="Design" />
            <Box x={355} y={160} label="Engineering" />
            <Box x={635} y={160} label="GTM" />
            <Box x={-15} y={250} w={150} label="Visual" tone="amber" />
            <Box x={155} y={250} w={150} label="Product" tone="amber" />
        </Frame>
    );
}

function DataDiagram() {
    return (
        <Frame>
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
                <Line x1={170} y1={100} x2={310} y2={100} />
                <Line x1={170} y1={210} x2={310} y2={210} />
                <Line x1={460} y1={155} x2={600} y2={155} />
            </svg>
            <div className="absolute left-[20px] top-[80px] w-[150px] rounded-md border border-sky-400 bg-sky-50 p-2 text-xs dark:bg-sky-500/15">
                <div className="mb-1 font-mono text-[10px] uppercase text-sky-700 dark:text-sky-300">users</div>
                <div className="font-mono text-[10px] text-sky-900 dark:text-sky-100">id · email · name</div>
            </div>
            <div className="absolute left-[20px] top-[190px] w-[150px] rounded-md border border-sky-400 bg-sky-50 p-2 text-xs dark:bg-sky-500/15">
                <div className="mb-1 font-mono text-[10px] uppercase text-sky-700 dark:text-sky-300">orgs</div>
                <div className="font-mono text-[10px] text-sky-900 dark:text-sky-100">id · slug · plan</div>
            </div>
            <div className="absolute left-[310px] top-[125px] w-[150px] rounded-md border border-violet-400 bg-violet-50 p-2 text-xs dark:bg-violet-500/15">
                <div className="mb-1 font-mono text-[10px] uppercase text-violet-700 dark:text-violet-300">memberships</div>
                <div className="font-mono text-[10px] text-violet-900 dark:text-violet-100">user_id · org_id · role</div>
            </div>
            <div className="absolute left-[600px] top-[135px] w-[150px] rounded-md border border-emerald-400 bg-emerald-50 p-2 text-xs dark:bg-emerald-500/15">
                <div className="mb-1 font-mono text-[10px] uppercase text-emerald-700 dark:text-emerald-300">audits</div>
                <div className="font-mono text-[10px] text-emerald-900 dark:text-emerald-100">org_id · event · at</div>
            </div>
        </Frame>
    );
}
