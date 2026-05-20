/**
 * Per-component live mini-previews used in the package detail grid.
 * Keyed by `${packageSlug}/${componentSlug}`. Each entry returns a
 * small React node sized to fit a 160-ish-pixel card body.
 *
 * Goal: every component card on /packages/{slug} shows the actual
 * component (or a faithful visual stub when stateful/complex) — never
 * just text-only pills.
 */
import { useState, type ReactNode } from "react";
import {
    Action,
    Avatar,
    Badge,
    Breadcrumbs,
    Calendar,
    Callout,
    Card,
    Heading,
    Pillbox,
    Switch,
    Tabs,
    Text,
    Timeline,
    Tooltip,
} from "@particle-academy/react-fancy";
import { EChart } from "@particle-academy/fancy-echarts";
import {
    Bell,
    Check,
    ChevronRight,
    ChevronDown,
    Cloud,
    Code,
    File as FileIcon,
    Folder,
    Heart,
    Home,
    Image as ImageIcon,
    Layers,
    LayoutGrid,
    Menu as MenuIcon,
    Moon,
    Music,
    Search,
    Settings,
    Sparkles,
    Star,
    Sun,
    User,
    X,
    Zap,
} from "lucide-react";

type PreviewFn = () => ReactNode;

export function getComponentPreview(pkg: string, slug: string): PreviewFn | null {
    return PREVIEWS[`${pkg}/${slug}`] ?? null;
}

// ─── react-fancy ──────────────────────────────────────────────────────────

const Pill = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
    <span className={`inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 ${className}`}>
        {children}
    </span>
);

const PREVIEWS: Record<string, PreviewFn> = {
    "react-fancy/accordion": () => (
        <div className="w-full max-w-[18rem] space-y-1.5 text-xs">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-3 py-2 text-zinc-700 dark:text-zinc-200">
                    <span className="font-medium">What is Fancy UI?</span>
                    <ChevronDown size={14} className="text-zinc-400" />
                </div>
                <div className="border-t border-zinc-100 px-3 py-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    A constellation of React + PHP primitives.
                </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                <span className="font-medium">How do I install?</span>
                <ChevronRight size={14} className="text-zinc-400" />
            </div>
        </div>
    ),

    "react-fancy/action": () => (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <Action color="violet" size="sm">Primary</Action>
            <Action variant="ghost" size="sm">Ghost</Action>
            <Action color="emerald" size="sm" icon="check">Save</Action>
            <Action color="red" variant="ghost" size="sm" icon="trash">Delete</Action>
        </div>
    ),

    "react-fancy/autocomplete": () => (
        <div className="w-full max-w-[18rem]">
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                <Search size={14} className="text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-200">cal</span>
                <span className="ml-0.5 h-3.5 w-px animate-pulse bg-violet-500" />
            </div>
            <ul className="mt-1.5 overflow-hidden rounded-md border border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
                <li className="bg-violet-50 px-3 py-1.5 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">Calendar</li>
                <li className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300">Callout</li>
                <li className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300">Card</li>
            </ul>
        </div>
    ),

    "react-fancy/avatar": () => (
        <div className="flex items-center -space-x-2">
            {["RK", "SL", "MC", "AY", "+3"].map((label, i) => (
                <span
                    key={label}
                    className={`inline-flex size-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-sm font-semibold text-white dark:border-zinc-900 ${
                        i === 0 ? "from-violet-400 to-sky-500"
                        : i === 1 ? "from-emerald-400 to-teal-500"
                        : i === 2 ? "from-amber-400 to-orange-500"
                        : i === 3 ? "from-rose-400 to-pink-500"
                        : "from-zinc-400 to-zinc-600"
                    }`}
                >
                    {label}
                </span>
            ))}
        </div>
    ),

    "react-fancy/badge": () => (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Badge color="violet">new</Badge>
            <Badge color="emerald">live</Badge>
            <Badge color="amber">beta</Badge>
            <Badge color="red">urgent</Badge>
            <Badge color="zinc">draft</Badge>
            <Badge color="indigo">v0.4</Badge>
        </div>
    ),

    "react-fancy/brand": () => (
        <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-sm">
                <Sparkles size={18} />
            </div>
            <div className="text-left">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Particle Academy</div>
                <div className="text-xs text-zinc-500">fancy ui kit</div>
            </div>
        </div>
    ),

    "react-fancy/breadcrumbs": () => (
        <div className="text-xs">
            <Breadcrumbs>
                <Breadcrumbs.Item href="#">Settings</Breadcrumbs.Item>
                <Breadcrumbs.Item href="#">Team</Breadcrumbs.Item>
                <Breadcrumbs.Item>Members</Breadcrumbs.Item>
            </Breadcrumbs>
        </div>
    ),

    "react-fancy/calendar": () => {
        const [value, setValue] = useState<Date | null>(new Date());
        return (
            <div className="scale-[0.85]">
                <Calendar value={value} onChange={setValue} />
            </div>
        );
    },

    "react-fancy/callout": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <Callout color="green">
                <Check size={14} className="mr-1 inline" /> Deploy succeeded
            </Callout>
            <Callout color="amber">
                <Bell size={14} className="mr-1 inline" /> Rate limit at 80%
            </Callout>
        </div>
    ),

    "react-fancy/card": () => (
        <div className="w-full max-w-[18rem]">
            <Card variant="elevated">
                <Card.Header>
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wider !text-zinc-500">Plan</Text>
                </Card.Header>
                <Card.Body>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pro</div>
                    <div className="text-xs text-zinc-500">$29/mo</div>
                </Card.Body>
            </Card>
        </div>
    ),

    "react-fancy/carousel": () => (
        <div className="w-full max-w-[18rem]">
            <div className="aspect-[16/9] rounded-md bg-gradient-to-br from-violet-400/40 via-sky-400/30 to-emerald-400/40">
                <div className="grid h-full place-items-center text-white">
                    <div className="text-center">
                        <Layers size={20} className="mx-auto" />
                        <div className="mt-1 text-xs font-medium">Slide 2 of 4</div>
                    </div>
                </div>
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1.5 w-4 rounded-full ${i === 1 ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                ))}
            </div>
        </div>
    ),

    "react-fancy/chart": () => (
        <div className="size-full min-h-[7rem] max-w-[18rem]">
            <EChart
                style={{ width: "100%", height: 120 }}
                option={{
                    grid: { left: 4, right: 4, top: 4, bottom: 4 },
                    xAxis: { type: "category", show: false, data: ["M", "T", "W", "T", "F"] },
                    yAxis: { type: "value", show: false },
                    series: [{
                        type: "line",
                        data: [12, 19, 15, 22, 18],
                        smooth: true,
                        itemStyle: { color: "#8b5cf6" },
                        lineStyle: { color: "#8b5cf6", width: 2 },
                        areaStyle: { color: "rgba(139, 92, 246, 0.15)" },
                        symbol: "circle",
                    }],
                    tooltip: { trigger: "axis", confine: true },
                }}
            />
        </div>
    ),

    "react-fancy/chat-drawer": () => (
        <div className="w-full max-w-[18rem] space-y-1.5">
            <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    Hey — quick question on the new bridge API.
                </div>
            </div>
            <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-500 px-3 py-1.5 text-xs text-white">
                    Sure. What's the question?
                </div>
            </div>
            <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-500 dark:bg-zinc-800">
                    <span className="inline-block size-1.5 animate-pulse rounded-full bg-zinc-400" />
                    <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
                    <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
                </div>
            </div>
        </div>
    ),

    "react-fancy/color-picker": () => (
        <div className="space-y-2 text-center">
            <div className="size-12 rounded-md border-2 border-white bg-violet-500 shadow-md ring-1 ring-zinc-200 dark:border-zinc-900 dark:ring-zinc-700" />
            <div className="flex gap-1.5">
                {["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"].map((c) => (
                    <span key={c} className="size-5 rounded ring-1 ring-zinc-200 dark:ring-zinc-700" style={{ background: c }} />
                ))}
            </div>
            <code className="font-mono text-[10px] text-zinc-500">#8b5cf6</code>
        </div>
    ),

    "react-fancy/command": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                <Search size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-500">Search…</span>
                <kbd className="ml-auto rounded border border-zinc-300 px-1 font-mono text-[10px] text-zinc-500 dark:border-zinc-700">⌘K</kbd>
            </div>
            <ul className="text-xs">
                <li className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                    <FileIcon size={12} /> New file
                </li>
                <li className="flex items-center gap-2 px-3 py-1.5 text-zinc-600 dark:text-zinc-300">
                    <Settings size={12} /> Open settings
                </li>
            </ul>
        </div>
    ),

    "react-fancy/composer": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200">
                Let&apos;s ship it.<span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-violet-500" />
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 px-2 py-1 dark:border-zinc-800">
                <div className="flex gap-1 text-zinc-400">
                    <Sparkles size={12} />
                    <ImageIcon size={12} />
                </div>
                <Action color="violet" size="sm">Send</Action>
            </div>
        </div>
    ),

    "react-fancy/content-renderer": () => (
        <div className="w-full max-w-[18rem] space-y-1.5 text-left">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Release notes</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
                Shipping <code className="rounded bg-zinc-100 px-1 text-[10px] dark:bg-zinc-800">v0.4</code> with Zustand-store registration. The Port system is gone.
            </div>
            <ul className="text-xs text-zinc-600 dark:text-zinc-300">
                <li>• Cleaner state model</li>
                <li>• Same agent introspectability</li>
            </ul>
        </div>
    ),

    "react-fancy/context-menu": () => (
        <div className="w-44 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <button className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Copy <kbd className="font-mono text-[10px] text-zinc-400">⌘C</kbd>
            </button>
            <button className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Paste <kbd className="font-mono text-[10px] text-zinc-400">⌘V</kbd>
            </button>
            <div className="my-0.5 h-px bg-zinc-100 dark:bg-zinc-800" />
            <button className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                Delete
            </button>
        </div>
    ),

    "react-fancy/dropdown": () => (
        <div className="w-44 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <User size={12} /> Profile
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Settings size={12} /> Settings
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Moon size={12} /> Dark mode
            </button>
        </div>
    ),

    "react-fancy/editor": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex gap-1 border-b border-zinc-100 px-2 py-1 dark:border-zinc-800">
                <button className="rounded px-1.5 py-0.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">B</button>
                <button className="rounded px-1.5 py-0.5 text-xs italic text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">I</button>
                <button className="rounded px-1.5 py-0.5 text-xs underline text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">U</button>
            </div>
            <div className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200">
                <strong>Bold</strong> and <em>italic</em> text — round-trip safe JSON.
            </div>
        </div>
    ),

    "react-fancy/emoji": () => (
        <div className="flex gap-2 text-2xl">
            <span>🚀</span><span>✨</span><span>🔥</span><span>🎯</span><span>💜</span>
        </div>
    ),

    "react-fancy/emoji-select": () => (
        <div className="w-44 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-1.5 flex items-center gap-1.5 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700">
                <Search size={10} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-500">Search emoji…</span>
            </div>
            <div className="grid grid-cols-6 gap-0.5 text-lg">
                {["😀", "😁", "😂", "🤣", "😅", "🥹", "🙂", "🥰", "😎", "🤔", "🙌", "👏"].map((e, i) => (
                    <button key={i} className="rounded p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">{e}</button>
                ))}
            </div>
        </div>
    ),

    "react-fancy/file-upload": () => (
        <div className="grid w-full max-w-[18rem] place-items-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-6 dark:border-zinc-700 dark:bg-zinc-900/40">
            <Cloud size={28} className="text-violet-500" />
            <div className="mt-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">Drop files here</div>
            <div className="text-[10px] text-zinc-500">or click to browse</div>
        </div>
    ),

    "react-fancy/heading": () => (
        <div className="w-full max-w-[18rem] space-y-1 text-left">
            <Heading level={1} size="lg">Display</Heading>
            <Heading level={2} size="md">Section title</Heading>
            <Heading level={3} size="sm">Subsection</Heading>
        </div>
    ),

    "react-fancy/icon": () => (
        <div className="grid grid-cols-6 gap-3 text-zinc-600 dark:text-zinc-300">
            <Home size={18} /><Settings size={18} /><Star size={18} /><Heart size={18} /><Music size={18} /><Zap size={18} />
        </div>
    ),

    "react-fancy/input-tag": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-1">
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200">agent <X size={10} className="ml-1" /></Pill>
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200">human+ux <X size={10} className="ml-1" /></Pill>
                <span className="text-xs text-zinc-400">Add…<span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-violet-500" /></span>
            </div>
        </div>
    ),

    "react-fancy/inputs": () => (
        <div className="w-full max-w-[18rem] space-y-2 text-left">
            <div>
                <div className="mb-0.5 text-[10px] font-medium text-zinc-500">Email</div>
                <div className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">user@example.com</div>
            </div>
            <div>
                <div className="mb-0.5 text-[10px] font-medium text-zinc-500">Role</div>
                <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    Admin <ChevronDown size={12} className="text-zinc-400" />
                </div>
            </div>
        </div>
    ),

    "react-fancy/kanban": () => (
        <div className="flex w-full max-w-[18rem] gap-1.5 text-[10px]">
            {[
                { label: "Todo", color: "bg-zinc-100 dark:bg-zinc-800", count: 4 },
                { label: "Doing", color: "bg-violet-100 dark:bg-violet-500/20", count: 2 },
                { label: "Done", color: "bg-emerald-100 dark:bg-emerald-500/20", count: 5 },
            ].map((col) => (
                <div key={col.label} className="flex-1 space-y-1">
                    <div className={`flex items-center justify-between rounded ${col.color} px-1.5 py-1 font-semibold text-zinc-700 dark:text-zinc-200`}>
                        {col.label} <span className="opacity-50">{col.count}</span>
                    </div>
                    <div className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">Task</div>
                    <div className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">Task</div>
                </div>
            ))}
        </div>
    ),

    "react-fancy/magic-wand": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="text-xs text-zinc-700 dark:text-zinc-200">
                <mark className="rounded bg-violet-100 px-0.5 dark:bg-violet-500/30">Selected text</mark> ready to transform.
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200"><Sparkles size={10} className="mr-1" /> Shorten</Pill>
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200"><Sparkles size={10} className="mr-1" /> Translate</Pill>
            </div>
        </div>
    ),

    "react-fancy/menu": () => (
        <div className="w-44 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Workspace</div>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <LayoutGrid size={12} /> Dashboard
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Folder size={12} /> Projects
            </button>
            <div className="my-0.5 h-px bg-zinc-100 dark:bg-zinc-800" />
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Settings size={12} /> Settings
            </button>
        </div>
    ),

    "react-fancy/mobile-menu": () => (
        <div className="relative h-32 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">App</span>
                <MenuIcon size={14} className="text-zinc-500" />
            </div>
            <div className="absolute inset-y-0 right-0 w-28 border-l border-zinc-200 bg-zinc-50 px-2 py-2 text-[10px] dark:border-zinc-800 dark:bg-zinc-950">
                <div className="rounded bg-violet-50 px-1.5 py-1 font-medium text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">Home</div>
                <div className="px-1.5 py-1 text-zinc-600 dark:text-zinc-300">Inbox</div>
                <div className="px-1.5 py-1 text-zinc-600 dark:text-zinc-300">Settings</div>
            </div>
        </div>
    ),

    "react-fancy/modal": () => (
        <div className="relative h-32 w-full max-w-[18rem] overflow-hidden rounded-md bg-zinc-200/60 dark:bg-zinc-800/60">
            <div className="absolute inset-2 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                    Confirm
                </div>
                <div className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">Delete this project?</div>
                <div className="flex justify-end gap-1.5 px-3 pb-2">
                    <Action variant="ghost" size="sm">Cancel</Action>
                    <Action color="red" size="sm">Delete</Action>
                </div>
            </div>
        </div>
    ),

    "react-fancy/mood-meter": () => (
        <div className="text-center">
            <div className="flex gap-2 text-3xl">
                <button className="opacity-50 hover:opacity-100">😢</button>
                <button className="opacity-50 hover:opacity-100">😐</button>
                <button className="opacity-100">🙂</button>
                <button className="opacity-50 hover:opacity-100">😊</button>
                <button className="opacity-50 hover:opacity-100">🤩</button>
            </div>
            <div className="mt-2 text-xs text-zinc-500">How&apos;s the new build?</div>
        </div>
    ),

    "react-fancy/navbar": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between bg-white px-3 py-2 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="size-5 rounded bg-gradient-to-br from-violet-500 to-sky-500" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Fancy</span>
                    <span className="text-xs text-violet-600 dark:text-violet-300">Docs</span>
                    <span className="text-xs text-zinc-500">Pricing</span>
                </div>
                <Sun size={14} className="text-zinc-500" />
            </div>
        </div>
    ),

    "react-fancy/otp-input": () => (
        <div className="flex items-center gap-1.5">
            {["4", "9", "1", "—", "—", "—"].map((d, i) => (
                <div
                    key={i}
                    className={`grid size-9 place-items-center rounded-md border font-mono text-base font-semibold ${
                        d === "—"
                            ? "border-zinc-200 bg-white text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
                            : "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-500/10 dark:text-violet-100"
                    }`}
                >
                    {d === "—" ? "" : d}
                </div>
            ))}
        </div>
    ),

    "react-fancy/pagination": () => (
        <div className="flex items-center gap-1 text-xs">
            <button className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 dark:border-zinc-700">←</button>
            {[1, 2, 3, "…", 12].map((p, i) => (
                <button
                    key={i}
                    className={`min-w-[28px] rounded px-2 py-1 ${
                        p === 2
                            ? "bg-violet-600 text-white"
                            : "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                >
                    {p}
                </button>
            ))}
            <button className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 dark:border-zinc-700">→</button>
        </div>
    ),

    "react-fancy/pillbox": () => {
        const [tags, setTags] = useState(["agent", "human+ux", "fancy-ui"]);
        return (
            <div className="w-full max-w-[18rem]">
                <Pillbox value={tags} onChange={setTags} color="violet" size="sm" />
            </div>
        );
    },

    "react-fancy/popover": () => (
        <div className="relative">
            <Action color="violet" size="sm">Click me</Action>
            <div className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 rounded-md border border-zinc-200 bg-white p-2.5 text-xs text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <div className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
                A floating panel anchored to a trigger.
            </div>
        </div>
    ),

    "react-fancy/portal": () => (
        <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg">
                <Layers size={24} />
            </div>
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">document.body</code>
            </div>
            <div className="mt-0.5 text-[10px] text-zinc-500">Renders outside the tree</div>
        </div>
    ),

    "react-fancy/profile": () => (
        <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-sky-500 text-sm font-semibold text-white">RK</span>
            <div className="text-left">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rita Kumar</div>
                <div className="text-xs text-zinc-500">Senior engineer · NYC</div>
            </div>
        </div>
    ),

    "react-fancy/progress": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <div>
                <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
                    <span>Uploading…</span>
                    <span>68%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-[68%] rounded-full bg-violet-500" />
                </div>
            </div>
            <div>
                <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
                    <span>Tests</span>
                    <span>100%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-full rounded-full bg-emerald-500" />
                </div>
            </div>
        </div>
    ),

    "react-fancy/prompt-input": () => (
        <div className="w-full max-w-[18rem] rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="px-2 pb-1 text-xs text-zinc-700 dark:text-zinc-200">
                Build me a calendar with team availability<span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-violet-500" />
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
                <div className="flex gap-1 text-zinc-400">
                    <Code size={12} />
                    <ImageIcon size={12} />
                </div>
                <Action color="violet" size="sm" icon="arrow-up" />
            </div>
        </div>
    ),

    "react-fancy/reason-tag": () => (
        <Tooltip content="Renewed user; 92% upgrade probability">
            <Pill className="!bg-amber-50 !text-amber-800 dark:!bg-amber-500/15 dark:!text-amber-200">
                <Sparkles size={10} className="mr-1" /> High intent
            </Pill>
        </Tooltip>
    ),

    "react-fancy/separator": () => (
        <div className="w-full max-w-[18rem] space-y-2 text-center">
            <Text size="xs" className="!text-zinc-500">Above</Text>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
            <Text size="xs" className="!text-zinc-500">Below</Text>
            <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-400">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                or
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
        </div>
    ),

    "react-fancy/sidebar": () => (
        <div className="w-44 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 py-1 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Workspace</div>
            <button className="flex w-full items-center gap-2 bg-violet-100 px-3 py-1.5 text-left text-xs font-medium text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                <Home size={12} /> Home
            </button>
            <button className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-2"><FileIcon size={12} /> Docs</span>
                <Badge color="violet">3</Badge>
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-300">
                <Settings size={12} /> Settings
            </button>
        </div>
    ),

    "react-fancy/skeleton": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-3 flex items-center gap-2">
                <div className="size-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-2 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-2 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
            </div>
        </div>
    ),

    "react-fancy/table": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 text-xs dark:border-zinc-700">
            <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                        <th className="px-2 py-1.5 text-left font-semibold text-zinc-500">Name</th>
                        <th className="px-2 py-1.5 text-right font-semibold text-zinc-500">Status</th>
                    </tr>
                </thead>
                <tbody className="text-zinc-700 dark:text-zinc-200">
                    <tr className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-2 py-1.5">api.prod</td>
                        <td className="px-2 py-1.5 text-right"><Badge color="emerald">live</Badge></td>
                    </tr>
                    <tr className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-2 py-1.5">api.stage</td>
                        <td className="px-2 py-1.5 text-right"><Badge color="amber">slow</Badge></td>
                    </tr>
                </tbody>
            </table>
        </div>
    ),

    "react-fancy/tabs": () => (
        <div className="w-full max-w-[20rem]">
            <Tabs defaultTab="overview">
                <Tabs.List>
                    <Tabs.Tab value="overview">Overview</Tabs.Tab>
                    <Tabs.Tab value="logs">Logs</Tabs.Tab>
                    <Tabs.Tab value="settings">Settings</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panels>
                    <Tabs.Panel value="overview">
                        <Text size="xs" className="mt-2 !text-zinc-500">3 active services · 0 alerts</Text>
                    </Tabs.Panel>
                    <Tabs.Panel value="logs"><Text size="xs" className="mt-2 !text-zinc-500">No recent events</Text></Tabs.Panel>
                    <Tabs.Panel value="settings"><Text size="xs" className="mt-2 !text-zinc-500">Configure your workspace</Text></Tabs.Panel>
                </Tabs.Panels>
            </Tabs>
        </div>
    ),

    "react-fancy/text": () => (
        <div className="w-full max-w-[18rem] space-y-1 text-left">
            <Text size="lg">Large paragraph.</Text>
            <Text size="md" className="!text-zinc-600 dark:!text-zinc-300">Medium for body copy.</Text>
            <Text size="sm" className="!text-zinc-500">Smaller for hints.</Text>
            <Text size="xs" className="!text-zinc-400">Extra small for metadata.</Text>
        </div>
    ),

    "react-fancy/timeline": () => (
        <div className="w-full max-w-[18rem]">
            <Timeline
                events={[
                    { date: "Jun 14", title: "Released v0.4", color: "violet" },
                    { date: "Jun 12", title: "Ports → Zustand", color: "sky" },
                    { date: "Jun 10", title: "Audit complete", color: "emerald" },
                ]}
                variant="stacked"
                animated={false}
            />
        </div>
    ),

    "react-fancy/time-picker": () => (
        <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <span className="rounded bg-violet-50 px-1.5 dark:bg-violet-500/15 dark:text-violet-100">09</span>
            <span className="text-zinc-400">:</span>
            <span>30</span>
            <span className="text-zinc-400">·</span>
            <span className="text-xs text-zinc-500">AM</span>
        </div>
    ),

    "react-fancy/toast": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 shadow-sm dark:border-emerald-700/50 dark:bg-zinc-900">
                <div className="mt-0.5 grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Check size={12} />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Saved</div>
                    <div className="text-[11px] text-zinc-500">Your settings are up to date.</div>
                </div>
                <X size={12} className="text-zinc-400" />
            </div>
        </div>
    ),

    "react-fancy/tooltip": () => (
        <div className="relative">
            <Action variant="ghost" size="sm" icon="info">Hover me</Action>
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[10px] text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900">
                <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100" />
                Helpful detail
            </div>
        </div>
    ),

    "react-fancy/tree-nav": () => (
        <div className="w-44 text-xs">
            <div className="flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                <ChevronDown size={12} className="text-zinc-400" />
                <Folder size={12} className="text-amber-500" /> src
            </div>
            <div className="ml-4 space-y-0.5">
                <div className="flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <ChevronDown size={12} className="text-zinc-400" />
                    <Folder size={12} className="text-amber-500" /> components
                </div>
                <div className="ml-4 flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <FileIcon size={12} className="text-violet-500" /> Card.tsx
                </div>
                <div className="ml-4 flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <FileIcon size={12} className="text-violet-500" /> Action.tsx
                </div>
                <div className="flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <FileIcon size={12} className="text-violet-500" /> index.ts
                </div>
            </div>
        </div>
    ),

    // ─── fancy-echarts ────────────────────────────────────────────────────

    "fancy-echarts/echart": () => (
        <div className="size-full min-h-[8rem] max-w-[18rem]">
            <EChart
                style={{ width: "100%", height: 120 }}
                option={{
                    grid: { left: 4, right: 4, top: 4, bottom: 4 },
                    xAxis: { type: "category", show: false, data: ["M", "T", "W", "T", "F", "S", "S"] },
                    yAxis: { type: "value", show: false },
                    series: [{ type: "bar", data: [12, 19, 15, 22, 18, 9, 14], itemStyle: { color: "#8b5cf6", borderRadius: [3, 3, 0, 0] }, barWidth: "55%" }],
                    tooltip: { trigger: "axis", confine: true },
                }}
            />
        </div>
    ),

    // (data-diagram / flowchart / mindmap / org-chart previews removed
    //  alongside the fancy-echarts 4.0.0 deletion of the hand-rolled
    //  diagram subsystem. Node-edge graphs live in fancy-flow now.)

    // ─── fancy-screens ────────────────────────────────────────────────────

    "fancy-screens/screen": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <div className="border-b border-zinc-100 bg-zinc-50 px-2 py-1 text-[10px] font-mono text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                screen.id = &quot;profile&quot;
            </div>
            <div className="space-y-1 p-2 text-xs">
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-200">
                    <span>Notifications</span><Switch checked={true} onChange={() => {}} />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">storeKeys: [user, prefs]</div>
            </div>
        </div>
    ),

    "fancy-screens/screen-system": () => (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
            {["inbox", "compose", "settings", "agent"].map((id, i) => (
                <div
                    key={id}
                    className={`rounded border px-2 py-1.5 ${
                        i === 0
                            ? "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-100"
                            : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                >
                    <div className="font-mono">{id}</div>
                    <div className="text-zinc-500">active</div>
                </div>
            ))}
        </div>
    ),

    // ─── fancy-flow ───────────────────────────────────────────────────────

    "fancy-flow/flow-editor": () => (
        <div className="flex items-center gap-2 text-[10px]">
            <div className="rounded border-2 border-violet-500 bg-violet-50 px-2 py-1.5 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                <div className="font-semibold">Input</div>
                <div className="text-zinc-500">trigger</div>
            </div>
            <div className="h-px w-3 bg-zinc-300" />
            <div className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <div className="font-semibold">Filter</div>
                <div className="text-zinc-500">where</div>
            </div>
            <div className="h-px w-3 bg-zinc-300" />
            <div className="rounded border-2 border-emerald-500 bg-emerald-50 px-2 py-1.5 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
                <div className="font-semibold">Output</div>
                <div className="text-zinc-500">sink</div>
            </div>
        </div>
    ),

    // ─── fancy-whiteboard ─────────────────────────────────────────────────

    "fancy-whiteboard/board": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md bg-amber-50/40 dark:bg-amber-900/10">
            <div className="absolute left-3 top-3 size-10 rotate-[-4deg] bg-yellow-200 p-1.5 text-[9px] shadow-sm">
                Q3 OKRs
            </div>
            <div className="absolute right-4 top-6 size-12 rotate-[3deg] bg-violet-200 p-1.5 text-[9px] text-violet-900 shadow-sm">
                Ship v0.4
            </div>
            <div className="absolute bottom-3 left-10 size-10 rotate-[-2deg] bg-emerald-200 p-1.5 text-[9px] text-emerald-900 shadow-sm">
                Audit
            </div>
            <div className="absolute right-8 bottom-6 size-3 rounded-full bg-violet-500 ring-2 ring-violet-300" />
        </div>
    ),

    // ─── holy-sheet ───────────────────────────────────────────────────────

    "holy-sheet/agent": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-emerald-50 px-2 py-1 text-[10px] dark:border-zinc-800 dark:bg-emerald-500/10">
                <span className="font-mono text-emerald-700 dark:text-emerald-200">q1-report.xlsx</span>
                <span className="text-emerald-700 dark:text-emerald-200">✓ written</span>
            </div>
            <div className="px-2 py-1.5 text-[10px] font-mono">
                <div className="text-zinc-500">Agent::write($schema)</div>
                <div className="text-zinc-700 dark:text-zinc-300">  ↳ 3 sheets, 142 rows</div>
            </div>
        </div>
    ),

    // ─── fancy-inertia ────────────────────────────────────────────────────

    "fancy-inertia/fancy-app-root": () => (
        <div className="w-full max-w-[18rem] space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center gap-2 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-violet-900 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-100">
                <Check size={10} /> Toast.Provider
            </div>
            <div className="flex items-center gap-2 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-violet-900 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-100">
                <Check size={10} /> ScreenSystem
            </div>
            <div className="flex items-center gap-2 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-violet-900 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-100">
                <Check size={10} /> ECharts modules
            </div>
        </div>
    ),

    "fancy-inertia/use-fancy-form": () => (
        <div className="w-full max-w-[18rem] space-y-1.5">
            <div>
                <div className="mb-0.5 text-[10px] text-zinc-500">Email</div>
                <div className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">user@example.com</div>
            </div>
            <div>
                <div className="mb-0.5 text-[10px] text-zinc-500">Password</div>
                <div className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-200">••••</div>
                <div className="mt-0.5 text-[10px] text-rose-600">Required</div>
            </div>
        </div>
    ),
};

// Generic fallback for components without a custom preview (rare).
export function GenericPlaceholder({ name }: { name: string }) {
    return (
        <div className="grid place-items-center text-center">
            <div className="rounded-lg bg-gradient-to-br from-violet-100 to-sky-100 px-3 py-1.5 font-mono text-xs text-violet-900 ring-1 ring-violet-200 dark:from-violet-500/15 dark:to-sky-500/15 dark:text-violet-100 dark:ring-violet-700">
                {name}
            </div>
            <div className="mt-2 text-[10px] text-zinc-500">Live preview coming soon</div>
        </div>
    );
}
