import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

/**
 * Mount target: <div id="component-demo" data-package="…" data-component="…"></div>
 *
 * Looks up the demo by `${package}/${component}` slug and renders it.
 * Falls back to a generic "demo coming soon" tile if nothing is registered
 * yet — the page still renders + the USAGE snippet still shows up.
 */

type DemoFn = () => JSX.Element;

const REGISTRY: Record<string, DemoFn> = {
    "react-fancy/action": ActionDemo,
    "react-fancy/badge": BadgeDemo,
    "react-fancy/card": CardDemo,
    "react-fancy/separator": SeparatorDemo,
    "react-fancy/skeleton": SkeletonDemo,
    "react-fancy/heading": HeadingDemo,
    "react-fancy/text": TextDemo,
    "react-fancy/icon": IconDemo,
    "react-fancy/avatar": AvatarDemo,
    "react-fancy/progress": ProgressDemo,
};

const USAGE: Record<string, string> = {
    "react-fancy/action": `import { Action } from "@particle-academy/react-fancy";

<Action color="violet" icon="sparkles" onClick={() => save()}>
  Save changes
</Action>`,
    "react-fancy/badge": `import { Badge } from "@particle-academy/react-fancy";

<Badge color="emerald">Active</Badge>
<Badge color="amber" variant="soft">Pending</Badge>`,
    "react-fancy/card": `import { Card } from "@particle-academy/react-fancy";

<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Body content goes here.</Card.Body>
</Card>`,
    "react-fancy/separator": `import { Separator } from "@particle-academy/react-fancy";

<Separator />`,
    "react-fancy/skeleton": `import { Skeleton } from "@particle-academy/react-fancy";

<Skeleton width={120} height={16} />`,
    "react-fancy/heading": `import { Heading } from "@particle-academy/react-fancy";

<Heading level={1} size="xl">Section title</Heading>`,
    "react-fancy/text": `import { Text } from "@particle-academy/react-fancy";

<Text size="sm">Plain paragraph text.</Text>`,
    "react-fancy/icon": `import { Icon } from "@particle-academy/react-fancy";

<Icon name="sparkles" size="md" />`,
    "react-fancy/avatar": `import { Avatar } from "@particle-academy/react-fancy";

<Avatar src="/me.jpg" name="Glenn Wagner" />`,
    "react-fancy/progress": `import { Progress } from "@particle-academy/react-fancy";

<Progress value={68} />`,
};

const mounts = document.querySelectorAll<HTMLElement>("[data-component-demo]");
mounts.forEach((el) => {
    const pkg = el.dataset.package ?? "";
    const comp = el.dataset.component ?? "";
    const slug = `${pkg}/${comp}`;
    createRoot(el).render(
        <StrictMode>
            <ComponentDemoMount slug={slug} pkg={pkg} comp={comp} />
        </StrictMode>,
    );
});

function ComponentDemoMount({ slug, pkg, comp }: { slug: string; pkg: string; comp: string }) {
    const Demo = REGISTRY[slug];
    const usage = USAGE[slug];
    const [showUsage, setShowUsage] = useState(false);
    const [copied, setCopied] = useState(false);

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                {Demo ? (
                    <Demo />
                ) : (
                    <div className="grid place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                        Interactive demo for <code className="font-mono">{comp}</code> is not yet wired
                        in the showcase registry. The import snippet below is canonical.
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5 text-xs">
                    <span className="font-mono text-zinc-400">Usage in your project</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setShowUsage((s) => !s)}
                            className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
                        >
                            {showUsage ? "hide" : "show"}
                        </button>
                        {usage && showUsage && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(usage).then(() => {
                                        setCopied(true);
                                        window.setTimeout(() => setCopied(false), 1200);
                                    });
                                }}
                                className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
                            >
                                {copied ? "copied" : "copy"}
                            </button>
                        )}
                    </div>
                </div>
                {showUsage && usage ? (
                    <pre className="overflow-x-auto p-3 text-[12px] leading-relaxed">
                        <code>{usage}</code>
                    </pre>
                ) : showUsage ? (
                    <div className="p-3 text-[11px] italic text-zinc-500">
                        No usage snippet written for this component yet.
                    </div>
                ) : (
                    <pre className="overflow-x-auto p-3 text-[12px] leading-relaxed text-zinc-400">
                        <code>{`import { ${comp} } from "@particle-academy/${pkg}";`}</code>
                    </pre>
                )}
            </div>
        </div>
    );
}

// ── Lightweight demo components (mocked locally to avoid pulling the whole react-fancy build in this island)

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: `var(--${color}-100)`, color: `var(--${color}-700)` }}
        >
            {children}
        </span>
    );
}

function ActionDemo() {
    const [count, setCount] = useState(0);
    return (
        <div className="flex flex-wrap items-center gap-3">
            <button
                onClick={() => setCount((c) => c + 1)}
                className="rounded-lg border border-violet-600 bg-violet-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-600"
            >
                Click me ({count})
            </button>
            <button className="rounded-lg border border-emerald-600 bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white">
                Saved
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                Cancel
            </button>
            <button disabled className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-500 opacity-50">
                Disabled
            </button>
        </div>
    );
}

function BadgeDemo() {
    return (
        <div className="flex flex-wrap gap-2">
            <Pill color="emerald">active</Pill>
            <Pill color="amber">pending</Pill>
            <Pill color="rose">error</Pill>
            <Pill color="sky">info</Pill>
            <Pill color="violet">new</Pill>
            <Pill color="zinc">archived</Pill>
        </div>
    );
}

function CardDemo() {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {["Q4 revenue", "Active customers"].map((t, i) => (
                <div key={t} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-500">{t}</div>
                    <div className="mt-1 text-2xl font-semibold">{i === 0 ? "$24,851" : "1,283"}</div>
                    <div className="mt-0.5 text-xs text-emerald-600">↑ {i === 0 ? "12%" : "4%"} vs last month</div>
                </div>
            ))}
        </div>
    );
}

function SeparatorDemo() {
    return (
        <div className="space-y-2 text-sm">
            <div>Above the line.</div>
            <hr className="border-zinc-200 dark:border-zinc-800" />
            <div>Below the line.</div>
        </div>
    );
}

function SkeletonDemo() {
    return (
        <div className="space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
    );
}

function HeadingDemo() {
    return (
        <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Heading level 1</h1>
            <h2 className="text-2xl font-semibold tracking-tight">Heading level 2</h2>
            <h3 className="text-xl font-semibold">Heading level 3</h3>
            <h4 className="text-base font-semibold">Heading level 4</h4>
        </div>
    );
}

function TextDemo() {
    return (
        <div className="space-y-1 text-sm">
            <p>Default body text — the workhorse for paragraphs.</p>
            <p className="text-zinc-500">Muted text, for captions and helpers.</p>
            <p className="text-xs">Small text for fine print.</p>
        </div>
    );
}

function IconDemo() {
    return (
        <div className="flex flex-wrap gap-3 text-zinc-700 dark:text-zinc-200">
            {["▣", "✦", "↗", "✓", "⚠", "$", "↻", "?"].map((g) => (
                <span key={g} className="grid h-8 w-8 place-items-center rounded-md bg-zinc-100 text-base dark:bg-zinc-800">
                    {g}
                </span>
            ))}
        </div>
    );
}

function AvatarDemo() {
    return (
        <div className="flex items-center gap-2">
            {["GW", "SL", "RK", "AY"].map((i, n) => (
                <span
                    key={i}
                    className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ background: ["#a855f7", "#3b82f6", "#10b981", "#f59e0b"][n] }}
                >
                    {i}
                </span>
            ))}
        </div>
    );
}

function ProgressDemo() {
    const [value, setValue] = useState(68);
    return (
        <div className="space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full bg-violet-500 transition-[width] duration-500" style={{ width: `${value}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-500">{value}%</span>
                <div className="flex gap-1">
                    <button onClick={() => setValue((v) => Math.max(0, v - 10))} className="rounded border border-zinc-300 px-2 py-0.5 text-[11px] dark:border-zinc-700">−10</button>
                    <button onClick={() => setValue((v) => Math.min(100, v + 10))} className="rounded border border-zinc-300 px-2 py-0.5 text-[11px] dark:border-zinc-700">+10</button>
                </div>
            </div>
        </div>
    );
}
