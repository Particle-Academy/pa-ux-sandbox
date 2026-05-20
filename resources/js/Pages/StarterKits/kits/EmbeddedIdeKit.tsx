import { useState } from "react";
import { Action, Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";

type Node = { id: string; label: string; kind: "folder" | "file"; lang?: string; children?: Node[]; content?: string };

const TREE: Node[] = [
    {
        id: "src", label: "src/", kind: "folder", children: [
            { id: "src/index.ts", label: "index.ts", kind: "file", lang: "ts", content: `import { startApp } from "./app";\nimport { config } from "./config";\n\nstartApp(config);\n` },
            { id: "src/app.ts", label: "app.ts", kind: "file", lang: "ts", content: `export function startApp(config: Config) {\n  console.log("starting", config.name);\n  // …\n}\n` },
            {
                id: "src/components", label: "components/", kind: "folder", children: [
                    { id: "src/components/Button.tsx", label: "Button.tsx", kind: "file", lang: "tsx", content: `export function Button({ children }: { children: React.ReactNode }) {\n  return <button className="rounded-md bg-violet-600 px-3 py-1 text-white">{children}</button>;\n}\n` },
                    { id: "src/components/Card.tsx", label: "Card.tsx", kind: "file", lang: "tsx", content: `export function Card({ title, children }) {\n  return (\n    <div className="rounded-xl border p-4">\n      <h3>{title}</h3>\n      {children}\n    </div>\n  );\n}\n` },
                ],
            },
        ],
    },
    { id: "README.md", label: "README.md", kind: "file", lang: "md", content: `# Project\n\nA tiny demo file tree.\n` },
    { id: "package.json", label: "package.json", kind: "file", lang: "json", content: `{\n  "name": "demo",\n  "version": "0.1.0"\n}\n` },
];

function flatten(nodes: Node[]): Node[] {
    const out: Node[] = [];
    for (const n of nodes) {
        out.push(n);
        if (n.children) out.push(...flatten(n.children));
    }
    return out;
}

const ALL = flatten(TREE);

export function EmbeddedIdeKit() {
    const [open, setOpen] = useState<Record<string, boolean>>({ src: true, "src/components": true });
    const [active, setActive] = useState<string>("src/index.ts");
    const file = ALL.find((n) => n.id === active);

    return (
        <div className="grid grid-cols-[220px_1fr] gap-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <aside className="border-r border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                <Tree
                    nodes={TREE}
                    depth={0}
                    open={open}
                    setOpen={setOpen}
                    active={active}
                    setActive={setActive}
                />
            </aside>
            <div className="flex flex-col bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
                    <span className="font-mono">{active}</span>
                    {file?.lang && <Badge color="zinc" size="sm">{file.lang}</Badge>}
                </div>
                <div className="flex-1 overflow-hidden">
                    <CodeEditor
                        value={file?.content ?? "(empty)"}
                        language={file?.lang ?? "tsx"}
                        theme="dark"
                        readOnly
                        minHeight={240}
                        maxHeight={480}
                    >
                        <CodeEditor.Panel />
                    </CodeEditor>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-500">
                    <span>{file?.content?.split("\n").length ?? 0} lines</span>
                    <span>{file?.lang ?? "—"} · LF · UTF-8</span>
                </div>
            </div>
        </div>
    );
}

function Tree({
    nodes, depth, open, setOpen, active, setActive,
}: {
    nodes: Node[]; depth: number; open: Record<string, boolean>;
    setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    active: string; setActive: (id: string) => void;
}) {
    return (
        <ul className={depth === 0 ? "" : "pl-3"}>
            {nodes.map((n) => {
                const isOpen = !!open[n.id];
                if (n.kind === "folder") {
                    return (
                        <li key={n.id}>
                            <button
                                onClick={() => setOpen((s) => ({ ...s, [n.id]: !isOpen }))}
                                className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <span className="text-zinc-400">{isOpen ? "▾" : "▸"}</span>
                                <span className="font-medium">{n.label}</span>
                            </button>
                            {isOpen && n.children && (
                                <Tree nodes={n.children} depth={depth + 1} open={open} setOpen={setOpen} active={active} setActive={setActive} />
                            )}
                        </li>
                    );
                }
                return (
                    <li key={n.id}>
                        <button
                            onClick={() => setActive(n.id)}
                            className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left ${
                                active === n.id
                                    ? "bg-violet-50 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100"
                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                        >
                            <span className="ml-3 text-zinc-400">·</span>
                            <span>{n.label}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
