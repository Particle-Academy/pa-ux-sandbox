import { lazy, Suspense, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
    Accordion,
    Button,
    Autocomplete,
    Avatar,
    Badge,
    Brand,
    Breadcrumbs,
    Calendar,
    Callout,
    Card,
    Carousel,
    Chart,
    ChatDrawer,
    ColorPicker,
    Command,
    Composer,
    ContentRenderer,
    ContextMenu,
    FauxClient,
    Dropdown,
    Editor,
    Emoji,
    EmojiSelect,
    FileUpload,
    Heading,
    Icon,
    Input,
    InputTag,
    Kanban,
    MagicWand,
    Menu,
    MobileMenu,
    Modal,
    MoodMeter,
    Navbar,
    OtpInput,
    Pagination,
    Pillbox,
    Popover,
    Portal,
    Profile,
    Progress,
    PromptInput,
    ReasonTag,
    Separator,
    Sidebar,
    Skeleton,
    Table,
    Tabs,
    Text,
    textareaAdapter,
    Timeline,
    TimePicker,
    Tooltip,
    TreeNav,
    useToast,
} from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";
import "@particle-academy/fancy-code/styles.css";
import { Board, StickyNote, CursorLayer } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { ArtBoard, ArtPiece, type ArtBoardValue } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { FlowEditor } from "@particle-academy/fancy-flow";
import "@particle-academy/fancy-flow/styles.css";
import { SheetWorkbook, createEmptyWorkbook, createEmptySheet } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";
import { EChart } from "@particle-academy/fancy-echarts";
import { Screen, ScreenSystem } from "@particle-academy/fancy-screens";
import { Canvas } from "@particle-academy/fancy-3d";
import { AgentPanel } from "@particle-academy/agent-integrations";
import {
    DeckEditor as FsDeckEditor,
    PresenterView as FsPresenterView,
    Slide as FsSlide,
    SlideViewer as FsSlideViewer,
    defaultTheme as fsDefaultTheme,
    darkTheme as fsDarkTheme,
    type Deck as FsDeck,
} from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";
import { PptxExportControl } from "./PptxExportControl";
import {
    CANONICAL_SLIDE,
    CANONICAL_DECK,
    CANONICAL_TEXT_SLIDE,
    CANONICAL_IMAGE_BOX,
    CANONICAL_IMAGE_SRC,
    CANONICAL_SHAPES_SLIDE,
    CANONICAL_HIGHLIGHTED_CODE,
    CANONICAL_HIGHLIGHTED_TOKENS,
    HIGHLIGHT_KIND_COLOR,
    PPTX_WRITER_COVERAGE,
    PPTX_READER_ROUNDTRIP,
} from "./showcase-fixtures";

type DemoFn = () => JSX.Element;

const REGISTRY: Record<string, DemoFn> = {
    // Buttons / actions
    "react-fancy/action": ActionDemo,
    "react-fancy/magic-wand": MagicWandDemo,
    // Text
    "react-fancy/heading": HeadingDemo,
    "react-fancy/text": TextDemo,
    "react-fancy/badge": BadgeDemo,
    "react-fancy/separator": SeparatorDemo,
    "react-fancy/brand": BrandDemo,
    "react-fancy/profile": ProfileDemo,
    "react-fancy/avatar": AvatarDemo,
    "react-fancy/icon": IconDemo,
    "react-fancy/emoji": EmojiDemo,
    "react-fancy/skeleton": SkeletonDemo,
    "react-fancy/progress": ProgressDemo,
    "react-fancy/reason-tag": ReasonTagDemo,
    // Card / container
    "react-fancy/card": CardDemo,
    "react-fancy/faux-client": FauxClientDemo,
    "react-fancy/callout": CalloutDemo,
    // Navigation
    "react-fancy/breadcrumbs": BreadcrumbsDemo,
    "react-fancy/tabs": TabsDemo,
    "react-fancy/accordion": AccordionDemo,
    "react-fancy/navbar": NavbarDemo,
    "react-fancy/sidebar": SidebarDemo,
    "react-fancy/mobile-menu": MobileMenuDemo,
    "react-fancy/menu": MenuDemo,
    "react-fancy/tree-nav": TreeNavDemo,
    "react-fancy/pagination": PaginationDemo,
    // Overlays
    "react-fancy/tooltip": TooltipDemo,
    "react-fancy/popover": PopoverDemo,
    "react-fancy/dropdown": DropdownDemo,
    "react-fancy/context-menu": ContextMenuDemo,
    "react-fancy/modal": ModalDemo,
    "react-fancy/toast": ToastDemo,
    "react-fancy/command": CommandDemo,
    "react-fancy/portal": PortalDemo,
    // Inputs / pickers
    "react-fancy/inputs": InputsDemo,
    "react-fancy/input-tag": InputTagDemo,
    "react-fancy/pillbox": PillboxDemo,
    "react-fancy/autocomplete": AutocompleteDemo,
    "react-fancy/file-upload": FileUploadDemo,
    "react-fancy/otp-input": OtpInputDemo,
    "react-fancy/calendar": CalendarDemo,
    "react-fancy/time-picker": TimePickerDemo,
    "react-fancy/color-picker": ColorPickerDemo,
    "react-fancy/emoji-select": EmojiSelectDemo,
    "react-fancy/mood-meter": MoodMeterDemo,
    "react-fancy/prompt-input": PromptInputDemo,
    "react-fancy/composer": ComposerDemo,
    "react-fancy/chat-drawer": ChatDrawerDemo,
    // Content
    "react-fancy/timeline": TimelineDemo,
    "react-fancy/table": TableDemo,
    "react-fancy/carousel": CarouselDemo,
    "react-fancy/chart": ChartDemo,
    "react-fancy/kanban": KanbanDemo,
    "react-fancy/content-renderer": ContentRendererDemo,
    "react-fancy/editor": EditorDemo,

    // ── fancy-whiteboard
    "fancy-whiteboard/board": WhiteboardBoardDemo,
    "fancy-whiteboard/sticky-note": WhiteboardStickyDemo,
    "fancy-whiteboard/cursor-layer": WhiteboardCursorDemo,
    "fancy-whiteboard/connector": WhiteboardConnectorDemo,
    "fancy-whiteboard/shape": WhiteboardShapeDemo,
    "fancy-whiteboard/drawing": WhiteboardDrawingDemo,

    // ── fancy-artboard
    "fancy-artboard/artboard": ArtboardDemo,
    "fancy-artboard/art-piece": ArtPieceDemo,
    "fancy-artboard/artboard-section": ArtboardSectionDemo,
    "fancy-artboard/artboard-note": ArtboardNoteDemo,

    // ── fancy-flow
    "fancy-flow/flow-editor": FlowEditorDemo,
    "fancy-flow/use-flow-state": FlowStateHookDemo,
    "fancy-flow/use-flow-run": FlowRunHookDemo,

    // ── fancy-sheets
    "fancy-sheets/sheet-workbook": SheetWorkbookDemo,
    "fancy-sheets/create-empty-workbook": EmptyWorkbookDemo,

    // ── fancy-code
    "fancy-code/code-editor": CodeEditorDemo,

    // ── fancy-echarts
    "fancy-echarts/echart": EChartDemo,

    // ── fancy-screens
    "fancy-screens/screen-system": ScreenSystemDemo,
    "fancy-screens/screen": ScreenDemo,

    // ── fancy-3d (engine-agnostic core)
    "fancy-3d/canvas": Fancy3DCanvasDemo,
    // ── fancy-3d-babylon (Babylon adapter)
    "fancy-3d-babylon/stage": Fancy3DStageDemo,
    "fancy-3d-babylon/monitor": Fancy3DMonitorDemo,
    "fancy-3d-babylon/card-3d": Fancy3DCard3DDemo,
    // ── fancy-3d-three (three.js adapter)
    "fancy-3d-three/stage": Fancy3DThreeStageDemo,
    "fancy-3d-three/monitor": Fancy3DThreeMonitorDemo,
    "fancy-3d-three/card-3d": Fancy3DThreeCard3DDemo,

    // ── agent-integrations
    "agent-integrations/micro-mcp-server": MicroMcpServerDemo,
    "agent-integrations/agent-panel": AgentPanelDemo,
    "agent-integrations/agent-cursor": AgentCursorDemo,
    "agent-integrations/shared-whiteboard": SharedWhiteboardDemo,
    "agent-integrations/share-controls": ShareControlsDemo,

    // ── holy-sheet (PHP — code-snippet only)
    "holy-sheet/agent": HolySheetAgentDemo,

    // ── fancy-slides
    "fancy-slides/slide": FsSlideRegistryDemo,
    "fancy-slides/slide-viewer": FsSlideViewerRegistryDemo,
    "fancy-slides/presenter-view": FsPresenterViewRegistryDemo,
    "fancy-slides/deck-editor": FsDeckEditorRegistryDemo,
    "fancy-slides/text-element": FsTextElementRegistryDemo,
    "fancy-slides/image-element": FsImageElementRegistryDemo,
    "fancy-slides/shape-element": FsShapeElementRegistryDemo,

    // ── dark-slide (PHP — code-snippet + live PPTX export)
    "dark-slide/agent": DarkSlideAgentRegistryDemo,
    "dark-slide/pptx-writer": DarkSlidePptxWriterRegistryDemo,
    "dark-slide/pptx-reader": DarkSlidePptxReaderRegistryDemo,
    "dark-slide/syntax-highlighter": DarkSlideSyntaxHighlighterRegistryDemo,

    // ── fancy-inertia
    "fancy-inertia/fancy-app-root": FancyAppRootDemo,
    "fancy-inertia/use-fancy-form": UseFancyFormDemo,
};

export function ComponentDemo({ slug, name, pkg }: { slug: string; name: string; pkg: string }) {
    const Demo = REGISTRY[`${pkg}/${slug}`];
    if (Demo) return <Demo />;
    return (
        <div className="grid place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-10 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
            Interactive demo for <code className="ml-1 font-mono">{name}</code> isn't wired yet.
            See the import snippet below.
        </div>
    );
}

// ─── Demos ──────────────────────────────────────────────────────────────────

/**
 * Wraps a rich/interactive demo with a clear "what's stock vs what's demo
 * scaffolding" footnote, so readers never confuse demo-only seed data or stub
 * handlers for out-of-the-box behaviour. `outOfBox` is required; `demo` is
 * optional (omit when the demo adds nothing beyond seed data).
 */
function DemoNote({ children, outOfBox, demo }: { children: ReactNode; outOfBox: string; demo?: string }) {
    return (
        <div className="space-y-2.5">
            {children}
            <div className="rounded-md border border-zinc-200 bg-zinc-50/70 px-3 py-2.5 text-[12px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-zinc-600 dark:text-zinc-300">
                    <span className="mr-1.5 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Out of the box
                    </span>
                    {outOfBox}
                </p>
                {demo && (
                    <p className="mt-1.5 text-zinc-600 dark:text-zinc-300">
                        <span className="mr-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                            Demo only
                        </span>
                        {demo}
                    </p>
                )}
            </div>
        </div>
    );
}

function ActionDemo() {
    return (
        <div className="flex flex-wrap gap-2">
            <Button color="violet">Primary</Button>
            <Button>Default</Button>
            <Button variant="ghost">Ghost</Button>
            <Button color="emerald" icon="check">Save</Button>
            <Button color="red" variant="ghost" icon="trash">Delete</Button>
            <Button disabled>Disabled</Button>
            <Button variant="circle" icon="search" aria-label="Search" />
            <Button variant="circle" color="violet" icon="plus" aria-label="New" />
        </div>
    );
}

function BadgeDemo() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge color="emerald">active</Badge>
            <Badge color="amber">pending</Badge>
            <Badge color="red">error</Badge>
            <Badge color="sky">info</Badge>
            <Badge color="violet">new</Badge>
            <Badge color="zinc">archived</Badge>
            <Badge color="emerald" size="sm">small</Badge>
            <Badge color="violet" size="lg">large</Badge>
        </div>
    );
}

function FauxClientDemo() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FauxClient variant="browser" url="fancy.test/agent-playground" meta="UTF-8">
                <div className="space-y-2 p-5">
                    <Badge color="emerald" dot>live</Badge>
                    <Text className="!font-semibold">Real, interactive UI</Text>
                    <Text size="sm" className="!text-zinc-500">The children render normally — this Button works.</Text>
                    <Button color="violet" size="sm" icon="sparkles">Try it</Button>
                </div>
            </FauxClient>
            <FauxClient variant="device">
                <div className="space-y-2 p-5">
                    <Text className="!font-semibold">Device chrome</Text>
                    <Text size="sm" className="!text-zinc-500">Same component, mobile/device framing.</Text>
                </div>
            </FauxClient>
        </div>
    );
}

function CardDemo() {
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <Card variant="outlined">
                <Card.Header>Outlined</Card.Header>
                <Card.Body><Text size="sm">Standard border, white background.</Text></Card.Body>
            </Card>
            <Card variant="elevated">
                <Card.Header>Elevated</Card.Header>
                <Card.Body><Text size="sm">Soft shadow, no heavy border.</Text></Card.Body>
            </Card>
            <Card variant="flat">
                <Card.Header>Flat</Card.Header>
                <Card.Body><Text size="sm">Recessed surface for grouping.</Text></Card.Body>
            </Card>
        </div>
    );
}

function HeadingDemo() {
    return (
        <div className="space-y-2">
            <Heading level={1} size="xl">Heading XL</Heading>
            <Heading level={2} size="lg">Heading LG</Heading>
            <Heading level={3} size="md">Heading MD</Heading>
            <Heading level={4} size="sm">Heading SM</Heading>
        </div>
    );
}

function TextDemo() {
    return (
        <div className="space-y-2">
            <Text>The workhorse body text.</Text>
            <Text size="sm">Smaller text for captions.</Text>
            <Text size="xs" className="!text-zinc-500">Even smaller and muted.</Text>
        </div>
    );
}

function SeparatorDemo() {
    return (
        <div className="space-y-3 text-sm">
            <div>Above the line.</div>
            <Separator />
            <div>Below the line.</div>
        </div>
    );
}

function AvatarDemo() {
    return (
        <div className="flex items-center gap-3">
            <Avatar name="Glenn Wagner" />
            <Avatar name="Rita Kumar" />
            <Avatar name="Sam Lin" />
            <Avatar name="Ayodeji Adekola" />
        </div>
    );
}

function BrandDemo() {
    return (
        <Brand
            logo={<img src="/showcase-assets/fancy-ui-logo.jpg" alt="" className="h-7 w-7 rounded" />}
            name="Fancy UI Kit"
            tagline="Particle Academy"
        />
    );
}

function SkeletonDemo() {
    return (
        <div className="max-w-sm space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-20 w-full" />
        </div>
    );
}

function ProgressDemo() {
    const [v, setV] = useState(42);
    return (
        <div className="space-y-3">
            <Progress value={v} />
            <div className="flex items-center justify-between text-xs">
                <span className="font-mono">{v}%</span>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setV((x) => Math.max(0, x - 10))}>−10</Button>
                    <Button variant="ghost" size="sm" onClick={() => setV((x) => Math.min(100, x + 10))}>+10</Button>
                </div>
            </div>
        </div>
    );
}

function BreadcrumbsDemo() {
    return (
        <Breadcrumbs>
            <Breadcrumbs.Item href="#">Workspace</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#">Projects</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#">Onboarding</Breadcrumbs.Item>
            <Breadcrumbs.Item>Step 3</Breadcrumbs.Item>
        </Breadcrumbs>
    );
}

function TabsDemo() {
    return (
        <Tabs defaultTab="overview">
            <Tabs.List>
                <Tabs.Tab value="overview">Overview</Tabs.Tab>
                <Tabs.Tab value="activity">Activity</Tabs.Tab>
                <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panels>
                <Tabs.Panel value="overview"><div className="p-3 text-sm">Project overview content.</div></Tabs.Panel>
                <Tabs.Panel value="activity"><div className="p-3 text-sm">Recent activity feed.</div></Tabs.Panel>
                <Tabs.Panel value="settings"><div className="p-3 text-sm">Project settings form.</div></Tabs.Panel>
            </Tabs.Panels>
        </Tabs>
    );
}

function AccordionDemo() {
    return (
        <Accordion>
            <Accordion.Item value="a">
                <Accordion.Trigger>What's Human+ UX?</Accordion.Trigger>
                <Accordion.Content>UI built for humans and agents to share the same surface, trading control fluidly.</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="b">
                <Accordion.Trigger>Why not Playwright?</Accordion.Trigger>
                <Accordion.Content>Brittle, slow, expensive. Bridges expose typed tools so agents drive without screen-scraping.</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="c">
                <Accordion.Trigger>What's the contract?</Accordion.Trigger>
                <Accordion.Content>Controlled state, stable handles, JSON-friendly inputs, bridgeable, observable, trust-but-verify.</Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
}

function CalloutDemo() {
    return (
        <div className="space-y-2">
            <Callout color="blue">Heads up — Inertia is the chrome layer.</Callout>
            <Callout color="green">Tests passed. Deploy is green.</Callout>
            <Callout color="amber">Heuristic, not deterministic — verify before sending.</Callout>
            <Callout color="red">Couldn't reach the upstream API.</Callout>
        </div>
    );
}

function TimelineDemo() {
    return (
        <Timeline>
            <Timeline.Item date="May 16" title="v0.6.1 released" color="emerald">
                Inertia + react-fancy chrome live across the showcase.
            </Timeline.Item>
            <Timeline.Item date="May 15" title="v0.6.0 released" color="violet">
                Showcase site Phase 1 → Phase 6 shipped.
            </Timeline.Item>
            <Timeline.Item date="May 11" title="Dreaming branch opened" color="sky">
                First wave of speculative components: 24 ideas.
            </Timeline.Item>
        </Timeline>
    );
}

function PaginationDemo() {
    const [page, setPage] = useState(3);
    return <Pagination currentPage={page} totalPages={12} onPageChange={setPage} />;
}

function TooltipDemo() {
    return (
        <div className="flex gap-3">
            <Tooltip content="Pin this dream">
                <Button variant="circle" icon="star" aria-label="Pin" />
            </Tooltip>
            <Tooltip content="Tooltips appear on hover">
                <Button>Hover me</Button>
            </Tooltip>
        </div>
    );
}

function PopoverDemo() {
    return (
        <Popover>
            <Popover.Trigger>
                <Button>Open popover</Button>
            </Popover.Trigger>
            <Popover.Content>
                <div className="w-56 p-3 text-sm">
                    <div className="font-semibold">Popover content</div>
                    <Text size="xs" className="mt-1 !text-zinc-500">Any React node fits in here.</Text>
                </div>
            </Popover.Content>
        </Popover>
    );
}

function PillboxDemo() {
    const [tags, setTags] = useState(["onboarding", "agent-ux"]);
    return <Pillbox value={tags} onChange={setTags} placeholder="add a tag…" />;
}

function AutocompleteDemo() {
    const [v, setV] = useState("");
    return (
        <Autocomplete
            value={v}
            onChange={setV}
            options={[
                { value: "glenn", label: "Glenn Wagner" },
                { value: "rita", label: "Rita Kumar" },
                { value: "sam", label: "Sam Lin" },
                { value: "ayodeji", label: "Ayodeji Adekola" },
                { value: "priya", label: "Priya Patel" },
            ]}
            placeholder="Search teammates…"
        />
    );
}

function ToastDemo() {
    const { toast } = useToast();
    return (
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast({ title: "Saved", description: "Your changes are live." })}>
                Show toast
            </Button>
            <Button color="emerald" onClick={() => toast({ title: "Deploy succeeded", variant: "success" })}>
                Success
            </Button>
            <Button color="red" onClick={() => toast({ title: "Couldn't reach API", variant: "error" })}>
                Error
            </Button>
        </div>
    );
}

function IconDemo() {
    const names = ["search", "settings", "plus", "trash", "edit", "check", "x", "star", "heart", "share", "download", "upload"];
    return (
        <div className="flex flex-wrap gap-3 text-zinc-700 dark:text-zinc-200">
            {names.map((n) => (
                <Tooltip key={n} content={n}>
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                        <Icon name={n} size="md" />
                    </span>
                </Tooltip>
            ))}
        </div>
    );
}

function EmojiDemo() {
    return (
        <div className="flex flex-wrap items-center gap-3 text-2xl">
            <Emoji emoji="🎉" size="lg" />
            <Emoji emoji="✨" size="lg" />
            <Emoji emoji="🔥" size="lg" />
            <Emoji emoji="🚀" size="lg" />
            <Emoji emoji="🤖" size="lg" />
            <Emoji emoji="🧠" size="lg" />
        </div>
    );
}

function ProfileDemo() {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Profile name="Glenn Wagner" subtitle="Founder · @glenn" status="online" />
            <Profile name="Claude" subtitle="AI agent" status="busy" />
            <Profile name="Rita Kumar" subtitle="Designer" status="away" />
            <Profile name="Sam Lin" subtitle="Engineer" status="offline" />
        </div>
    );
}

function ReasonTagDemo() {
    return (
        <div className="space-y-2 text-sm">
            <div>
                MRR projection: {" "}
                <ReasonTag value="$24,851" reason="Sum of active subscriptions × monthly price, projected forward 30 days based on 12% MoM growth." confidence={0.84} />
            </div>
            <div>
                Risk score: {" "}
                <ReasonTag value="Low" reason="No charge failures in the last 90 days; usage trending up." confidence={0.92} theme="chip" />
            </div>
        </div>
    );
}

function ColorPickerDemo() {
    const [color, setColor] = useState("#a855f7");
    return (
        <div className="flex items-center gap-3">
            <ColorPicker value={color} onChange={setColor} presets={["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]} />
            <code className="font-mono text-sm">{color}</code>
        </div>
    );
}

function CalendarDemo() {
    const [date, setDate] = useState<Date | null>(new Date());
    return (
        <div className="flex gap-6">
            <Calendar mode="single" value={date} onChange={(d) => setDate(d as Date)} />
            <div className="text-sm">
                <Text size="xs" className="!text-zinc-500 uppercase tracking-wider">selected</Text>
                <div className="mt-1 font-mono">{date?.toLocaleDateString() ?? "—"}</div>
            </div>
        </div>
    );
}

function TimePickerDemo() {
    const [t, setT] = useState("14:30");
    return (
        <div className="flex items-center gap-3">
            <TimePicker value={t} onChange={setT} format="24h" />
            <code className="font-mono text-sm">{t}</code>
        </div>
    );
}

function OtpInputDemo() {
    const [v, setV] = useState("");
    return (
        <div className="space-y-2">
            <OtpInput length={6} value={v} onChange={setV} />
            <Text size="xs" className="!text-zinc-500 font-mono">value: {v || "(empty)"}</Text>
        </div>
    );
}

function FileUploadDemo() {
    const [files, setFiles] = useState<File[]>([]);
    return (
        <FileUpload value={files} onChange={setFiles} multiple>
            <FileUpload.Dropzone>
                <div className="grid place-items-center rounded-md border-2 border-dashed border-zinc-300 p-8 text-sm text-zinc-500 dark:border-zinc-700">
                    Drop files here or click to browse
                </div>
            </FileUpload.Dropzone>
            <FileUpload.List />
        </FileUpload>
    );
}

function EmojiSelectDemo() {
    const [v, setV] = useState("🎉");
    return (
        <div className="flex items-center gap-3">
            <EmojiSelect value={v} onChange={setV} />
            <span className="text-2xl">{v}</span>
        </div>
    );
}

function ComposerDemo() {
    const [v, setV] = useState("");
    return (
        <Composer
            value={v}
            onChange={setV}
            onSubmit={(text) => alert("submitted: " + text)}
            placeholder="Reply to thread…"
        />
    );
}

function ModalDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button color="violet" onClick={() => setOpen(true)}>Open modal</Button>
            <Modal open={open} onClose={() => setOpen(false)} size="md">
                <Modal.Header>Are you sure?</Modal.Header>
                <Modal.Body>
                    <Text size="sm">This will archive the dream. You can restore it later from the archived list.</Text>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button color="red" onClick={() => setOpen(false)}>Archive</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

function DropdownDemo() {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <Button>Open menu</Button>
            </Dropdown.Trigger>
            <Dropdown.Items>
                <Dropdown.Item onClick={() => alert("Edit")}>Edit</Dropdown.Item>
                <Dropdown.Item onClick={() => alert("Duplicate")}>Duplicate</Dropdown.Item>
                <Dropdown.Item onClick={() => alert("Archive")}>Archive</Dropdown.Item>
            </Dropdown.Items>
        </Dropdown>
    );
}

function ContextMenuDemo() {
    return (
        <ContextMenu>
            <ContextMenu.Trigger>
                <div className="grid h-32 place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                    Right-click anywhere in this box
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Item onClick={() => alert("Cut")}>Cut</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Copy")}>Copy</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Paste")}>Paste</ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu>
    );
}

function CommandDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button color="violet" onClick={() => setOpen(true)}>Open ⌘K</Button>
            <Command open={open} onClose={() => setOpen(false)}>
                <Command.Input placeholder="Type a command…" />
                <Command.List>
                    <Command.Group heading="Navigation">
                        <Command.Item onSelect={() => { alert("Go to inbox"); setOpen(false); }}>Go to inbox</Command.Item>
                        <Command.Item onSelect={() => { alert("Go to projects"); setOpen(false); }}>Go to projects</Command.Item>
                    </Command.Group>
                    <Command.Group heading="Create">
                        <Command.Item onSelect={() => { alert("New doc"); setOpen(false); }}>New document</Command.Item>
                        <Command.Item onSelect={() => { alert("New board"); setOpen(false); }}>New board</Command.Item>
                    </Command.Group>
                    <Command.Empty>No commands match.</Command.Empty>
                </Command.List>
            </Command>
        </>
    );
}

function PortalDemo() {
    return (
        <Portal>
            <div className="fixed bottom-4 right-4 rounded-md bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg">
                Rendered via Portal in document.body
            </div>
        </Portal>
    );
}

function MenuDemo() {
    return (
        <Menu orientation="vertical" className="w-56">
            <Menu.Item href="#" active>Inbox</Menu.Item>
            <Menu.Item href="#" badge={<Badge color="violet" size="sm">3</Badge>}>Projects</Menu.Item>
            <Menu.Item href="#">Team</Menu.Item>
            <Menu.Item href="#">Settings</Menu.Item>
            <Menu.Item href="#" disabled>Coming soon</Menu.Item>
        </Menu>
    );
}

function MobileMenuDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Open mobile menu</Button>
            <MobileMenu.Flyout open={open} onClose={() => setOpen(false)}>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Inbox</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Projects</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Team</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Settings</MobileMenu.Item>
            </MobileMenu.Flyout>
        </>
    );
}

function NavbarDemo() {
    return (
        <Navbar className="rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Navbar.Brand>
                <div className="text-sm font-semibold">Acme</div>
            </Navbar.Brand>
            <Navbar.Items>
                <Navbar.Item href="#" active>Home</Navbar.Item>
                <Navbar.Item href="#">Docs</Navbar.Item>
                <Navbar.Item href="#">Pricing</Navbar.Item>
            </Navbar.Items>
            <Button size="sm" color="violet">Sign up</Button>
        </Navbar>
    );
}

function SidebarDemo() {
    return (
        <div className="grid grid-cols-[200px_1fr] gap-4">
            <Sidebar className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                <Sidebar.Group>
                    <Sidebar.Item href="#" active>Inbox</Sidebar.Item>
                    <Sidebar.Item href="#" badge={<Badge color="violet" size="sm">3</Badge>}>Projects</Sidebar.Item>
                    <Sidebar.Item href="#">Team</Sidebar.Item>
                    <Sidebar.Item href="#">Settings</Sidebar.Item>
                </Sidebar.Group>
            </Sidebar>
            <div className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
                Main content area
            </div>
        </div>
    );
}

function TreeNavDemo() {
    const tree = [
        {
            id: "src", label: "src", type: "folder" as const,
            children: [
                { id: "index", label: "index.ts", type: "file" as const, ext: "ts" },
                { id: "app", label: "app.ts", type: "file" as const, ext: "ts" },
                {
                    id: "components", label: "components", type: "folder" as const,
                    children: [
                        { id: "btn", label: "Button.tsx", type: "file" as const, ext: "tsx" },
                        { id: "card", label: "Card.tsx", type: "file" as const, ext: "tsx" },
                    ],
                },
            ],
        },
        { id: "readme", label: "README.md", type: "file" as const, ext: "md" },
        { id: "pkg", label: "package.json", type: "file" as const, ext: "json" },
    ];
    return (
        <div className="max-w-xs rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
            <TreeNav nodes={tree} defaultExpanded={["src", "components"]} />
        </div>
    );
}

function InputsDemo() {
    const [text, setText] = useState("");
    const [check, setCheck] = useState(true);
    return (
        <div className="grid max-w-md gap-3">
            <label className="grid gap-1 text-sm">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Text input</span>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type something…"
                    className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-violet-500 dark:border-zinc-700"
                />
            </label>
            <label className="grid gap-1 text-sm">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Select</span>
                <select className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900">
                    <option>Founder</option>
                    <option>Designer</option>
                    <option>Engineer</option>
                </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} className="h-4 w-4 accent-violet-600" />
                Subscribe to the changelog
            </label>
        </div>
    );
}

function InputTagDemo() {
    const ref = useRef<HTMLTextAreaElement>(null);
    const adapter = useState(() => textareaAdapter(ref))[0];
    return (
        <div className="grid gap-2 text-sm">
            <Text size="xs" className="!text-zinc-500">
                Try typing <code className="font-mono">/</code> for slash-commands or <code className="font-mono">@</code> for mentions.
            </Text>
            <textarea
                ref={ref}
                placeholder="Compose a message — try / or @"
                rows={3}
                className="rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:border-violet-500 dark:border-zinc-700"
            />
            <InputTag
                adapter={adapter}
                triggers={{
                    "/": {
                        items: [
                            { id: "summarize", name: "Summarize thread" },
                            { id: "tldr", name: "TL;DR" },
                            { id: "actions", name: "Pull action items" },
                        ],
                        insert: (item: any) => "/" + item.id + " ",
                    },
                    "@": {
                        items: [
                            { id: "glenn", name: "Glenn Wagner" },
                            { id: "rita", name: "Rita Kumar" },
                            { id: "sam", name: "Sam Lin" },
                        ],
                        insert: (item: any) => "@" + item.id + " ",
                    },
                }}
            />
        </div>
    );
}

function PromptInputDemo() {
    return (
        <PromptInput
            budgetTokens={4096}
            commands={[
                { name: "/summarize", hint: "Summarize the thread" },
                { name: "/tldr", hint: "One-paragraph TL;DR" },
            ]}
            mentions={[
                { id: "glenn", name: "Glenn Wagner", kind: "person" },
                { id: "rita", name: "Rita Kumar", kind: "person" },
                { id: "claude", name: "Claude", kind: "agent" },
            ]}
            onSubmit={(text) => alert("submitted: " + text)}
        />
    );
}

function MagicWandDemo() {
    const [v, setV] = useState("Highlight some of this text to see the wand pop up. Then choose an action.");
    return (
        <MagicWand
            value={v}
            onValueChange={setV}
            actions={[
                { id: "shorten", label: "Shorten" },
                { id: "upper", label: "Uppercase" },
            ]}
            onAction={(action, selection, _replacement) => {
                const transform = action.id === "upper"
                    ? selection.text.toUpperCase()
                    : selection.text.split(/\s+/).slice(0, Math.ceil(selection.text.split(/\s+/).length / 2)).join(" ");
                setV((cur) => cur.slice(0, selection.start) + transform + cur.slice(selection.end));
            }}
        />
    );
}

function MoodMeterDemo() {
    const [v, setV] = useState({ value: 6, confidence: 0.7 });
    return (
        <div className="grid grid-cols-[1fr_140px] gap-6 items-center">
            <MoodMeter
                min={0}
                max={10}
                step={0.1}
                value={v.value}
                confidence={v.confidence}
                onChange={(value, confidence) => setV({ value, confidence })}
            />
            <div className="text-sm font-mono">
                <div>value: {v.value.toFixed(1)}</div>
                <div>confidence: {(v.confidence * 100).toFixed(0)}%</div>
            </div>
        </div>
    );
}

function ChatDrawerDemo() {
    const [active, setActive] = useState("inbox");
    return (
        <ChatDrawer
            tabs={[
                { id: "inbox", label: "Inbox", badge: 3 },
                { id: "agents", label: "Agents", badge: 1 },
                { id: "notifications", label: "Activity" },
            ]}
            activeTabId={active}
            onTabChange={setActive}
        >
            <div className="p-3 text-sm">
                Active tab: <code className="font-mono">{active}</code>
            </div>
        </ChatDrawer>
    );
}

function TableDemo() {
    const rows = [
        { name: "Acme Robotics", mrr: 4990, seats: 42 },
        { name: "Vector Foods", mrr: 2900, seats: 18 },
        { name: "Lumen Cycles", mrr: 0, seats: 5 },
    ];
    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.Column label="Customer" sortKey="name" />
                    <Table.Column label="MRR" sortKey="mrr" className="!text-right" />
                    <Table.Column label="Seats" sortKey="seats" className="!text-right" />
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {rows.map((r) => (
                    <Table.Row key={r.name}>
                        <Table.Cell>{r.name}</Table.Cell>
                        <Table.Cell className="text-right font-mono">${r.mrr.toLocaleString()}</Table.Cell>
                        <Table.Cell className="text-right font-mono">{r.seats}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}

function CarouselDemo() {
    return (
        <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Carousel variant="directional" loop>
                <Carousel.Panels>
                    {[
                        { tone: "from-violet-400 to-sky-400", title: "Authorable" },
                        { tone: "from-emerald-400 to-sky-400", title: "Inhabitable" },
                        { tone: "from-amber-400 to-rose-400", title: "Composable" },
                    ].map((s, i) => (
                        <Carousel.Slide key={i} name={`slide-${i}`}>
                            <div className={`grid h-40 place-items-center bg-gradient-to-br ${s.tone}`}>
                                <span className="text-2xl font-semibold text-white">{s.title}</span>
                            </div>
                        </Carousel.Slide>
                    ))}
                </Carousel.Panels>
                <Carousel.Controls />
                <Carousel.Steps />
            </Carousel>
        </div>
    );
}

function ChartDemo() {
    return (
        <Chart.Bar
            data={[
                { label: "Q1", value: 12000, color: "#a855f7" },
                { label: "Q2", value: 18500, color: "#a855f7" },
                { label: "Q3", value: 22000, color: "#a855f7" },
                { label: "Q4", value: 26500, color: "#a855f7" },
            ]}
            height={200}
            showValues
        />
    );
}

function KanbanDemo() {
    type Card = { id: string; column: "todo" | "doing" | "done"; title: string };
    const [cards, setCards] = useState<Card[]>([
        { id: "c1", column: "todo", title: "Wire showcase scanner" },
        { id: "c2", column: "todo", title: "Backfill leaderboard data" },
        { id: "c3", column: "doing", title: "Component demos pass 2" },
        { id: "c4", column: "done", title: "Inertia + react-fancy chrome" },
        { id: "c5", column: "done", title: "Starter kits live" },
    ]);

    const columns: { id: Card["column"]; title: string }[] = [
        { id: "todo", title: "To do" },
        { id: "doing", title: "In progress" },
        { id: "done", title: "Done" },
    ];

    return (
        <Kanban
            onCardMove={(cardId, _from, toColumn, _toIndex) => {
                setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column: toColumn as Card["column"] } : c)));
            }}
        >
            {columns.map((col) => (
                <Kanban.Column key={col.id} id={col.id}>
                    <Kanban.ColumnHandle>
                        <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{col.title}</span>
                            <Badge color="zinc" size="sm">{cards.filter((c) => c.column === col.id).length}</Badge>
                        </div>
                    </Kanban.ColumnHandle>
                    {cards.filter((c) => c.column === col.id).map((c) => (
                        <Kanban.Card key={c.id} id={c.id}>
                            <div className="rounded-md border border-zinc-200 bg-white p-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                                {c.title}
                            </div>
                        </Kanban.Card>
                    ))}
                </Kanban.Column>
            ))}
        </Kanban>
    );
}

// ─── Helpers for non-mountable components ──────────────────────────────────

function Explainer({
    summary,
    code,
    bullets,
    kind = "code-reference",
    language = "tsx",
}: {
    summary: string;
    code?: string;
    bullets?: string[];
    /**
     * Labels the preview so it's clear when a snippet IS the canonical
     * preview (PHP libs, server-side bridges, types — anything without a
     * meaningful React render).
     */
    kind?: "code-reference" | "server-side" | "php";
    language?: "tsx" | "ts" | "php";
}) {
    const label = kind === "php" ? "PHP · server-side reference" : kind === "server-side" ? "Server-side · reference" : "Code reference";
    const labelTone = kind === "php" ? "text-indigo-600 dark:text-indigo-300" : "text-violet-600 dark:text-violet-300";
    return (
        <div className="space-y-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${labelTone}`}>
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {label}
            </div>
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">{summary}</Text>
            {bullets && (
                <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
            )}
            {code && (
                <div className="overflow-hidden rounded-md">
                    <CodeEditor value={code} language={language} theme="dark" readOnly minHeight={60} maxHeight={400}>
                        <CodeEditor.Panel />
                    </CodeEditor>
                </div>
            )}
        </div>
    );
}

// ─── fancy-whiteboard ──────────────────────────────────────────────────────

function WhiteboardBoardDemo() {
    const [notes, setNotes] = useState([
        { id: "n1", x: 60, y: 40, w: 140, h: 90, color: "#fde68a", text: "Onboarding feels heavy at step 3" },
        { id: "n2", x: 240, y: 70, w: 140, h: 90, color: "#a5b4fc", text: "Try one-click templates" },
        { id: "n3", x: 150, y: 200, w: 140, h: 90, color: "#bef264", text: "Ship v0.4 — track time-to-first-board" },
    ]);
    const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
    return (
        <div className="h-80 overflow-hidden rounded-md border border-zinc-200 bg-amber-50/30 dark:border-zinc-800 dark:bg-amber-900/10">
            <Board notes={notes} onNotesChange={setNotes} viewport={viewport} onViewportChange={setViewport}>
                <StickyNote />
                <CursorLayer cursors={[
                    { id: "c1", name: "Ada", color: "#a855f7", x: 320, y: 60 },
                    { id: "c2", name: "Claude", color: "#3b82f6", x: 120, y: 220 },
                ]} />
            </Board>
        </div>
    );
}

function WhiteboardStickyDemo() {
    const [notes, setNotes] = useState([
        { id: "n1", text: "Onboarding feels heavy at step 3", color: "#fde68a" },
        { id: "n2", text: "Try one-click templates", color: "#a5b4fc" },
        { id: "n3", text: "Track time-to-first-board", color: "#bef264" },
    ]);
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {notes.map((n) => (
                <div key={n.id} className="rounded-md p-3 text-sm text-zinc-900 shadow-sm" style={{ background: n.color }}>
                    <input
                        value={n.text}
                        onChange={(e) => setNotes((arr) => arr.map((x) => x.id === n.id ? { ...x, text: e.target.value } : x))}
                        className="w-full bg-transparent outline-none"
                    />
                </div>
            ))}
        </div>
    );
}

function WhiteboardCursorDemo() {
    return (
        <div className="relative h-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            {[
                { name: "Glenn", color: "#a855f7", x: "20%", y: "30%" },
                { name: "Rita", color: "#10b981", x: "55%", y: "60%" },
                { name: "Claude", color: "#3b82f6", x: "75%", y: "25%" },
            ].map((c) => (
                <div key={c.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: c.x, top: c.y }}>
                    <span className="block h-3 w-3 rounded-full" style={{ background: c.color, boxShadow: `0 0 0 4px ${c.color}33` }} />
                    <span className="absolute left-3 top-3 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] text-white" style={{ background: c.color }}>{c.name}</span>
                </div>
            ))}
        </div>
    );
}

function WhiteboardConnectorDemo() {
    return (
        <svg viewBox="0 0 400 160" className="h-40 w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <rect x="20" y="60" width="80" height="40" rx="6" className="fill-violet-100 stroke-violet-400 dark:fill-violet-500/15" />
            <rect x="160" y="20" width="80" height="40" rx="6" className="fill-sky-100 stroke-sky-400 dark:fill-sky-500/15" />
            <rect x="160" y="100" width="80" height="40" rx="6" className="fill-emerald-100 stroke-emerald-400 dark:fill-emerald-500/15" />
            <rect x="300" y="60" width="80" height="40" rx="6" className="fill-amber-100 stroke-amber-400 dark:fill-amber-500/15" />
            <path d="M100 80 C130 80, 130 40, 160 40" className="fill-none stroke-zinc-400" strokeWidth={1.5} />
            <path d="M100 80 C130 80, 130 120, 160 120" className="fill-none stroke-zinc-400" strokeWidth={1.5} />
            <path d="M240 40 C270 40, 270 80, 300 80" className="fill-none stroke-zinc-400" strokeWidth={1.5} />
            <path d="M240 120 C270 120, 270 80, 300 80" className="fill-none stroke-zinc-400" strokeWidth={1.5} />
        </svg>
    );
}

function WhiteboardShapeDemo() {
    return (
        <svg viewBox="0 0 400 160" className="h-40 w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <rect x="30" y="40" width="70" height="80" rx="4" className="fill-violet-200 stroke-violet-500 dark:fill-violet-500/30" />
            <circle cx="170" cy="80" r="40" className="fill-sky-200 stroke-sky-500 dark:fill-sky-500/30" />
            <polygon points="260,40 300,120 220,120" className="fill-emerald-200 stroke-emerald-500 dark:fill-emerald-500/30" />
            <polygon points="350,40 380,80 350,120 320,80" className="fill-amber-200 stroke-amber-500 dark:fill-amber-500/30" />
        </svg>
    );
}

function WhiteboardDrawingDemo() {
    return (
        <svg viewBox="0 0 400 160" className="h-40 w-full rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <path d="M20 80 C 60 40, 100 120, 140 80 S 220 40, 260 80 S 340 120, 380 80" stroke="rgb(168, 85, 247)" strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d="M40 130 Q 80 110, 120 130 T 200 130" stroke="rgb(16, 185, 129)" strokeWidth={2} fill="none" strokeLinecap="round" />
            <path d="M260 30 L 290 50 L 270 70 L 300 90" stroke="rgb(239, 68, 68)" strokeWidth={2} fill="none" strokeLinecap="round" />
        </svg>
    );
}

// ─── fancy-artboard ──────────────────────────────────────────────────────

const ARTBOARD_HTML_MOCKUP = `
<div style="height:100%;display:flex;flex-direction:column;font-family:system-ui,sans-serif;background:#fff;color:#18181b">
  <div style="padding:18px 18px 0">
    <div style="font-size:13px;font-weight:600;color:#7c3aed">Particle</div>
    <h1 style="margin:14px 0 6px;font-size:26px;line-height:1.15">Build with humans <em>and</em> agents.</h1>
    <p style="margin:0;font-size:13px;color:#71717a">One surface. Trade control fluidly.</p>
    <button style="margin-top:14px;padding:8px 16px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:13px">Get started</button>
  </div>
  <div style="margin-top:auto;height:120px;background:linear-gradient(135deg,#a78bfa,#38bdf8)"></div>
</div>`;

function ArtboardDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "onboarding",
                title: "Onboarding",
                subtitle: "First-run hero variants",
                pieces: [
                    {
                        id: "hero-a",
                        label: "A · HTML mockup",
                        width: 320,
                        height: 460,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                    {
                        id: "hero-b",
                        label: "B · Image",
                        width: 320,
                        height: 460,
                        content: {
                            kind: "image",
                            src: "/showcase-assets/fancy-ui-logo.jpg",
                            alt: "Reference shot",
                        },
                    },
                    {
                        id: "hero-c",
                        label: "C · Live JSX",
                        width: 320,
                        height: 460,
                        content: { kind: "node" },
                    },
                    {
                        id: "hero-d",
                        label: "D · Agent draft",
                        width: 320,
                        height: 460,
                        pending: true,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                ],
            },
        ],
    });
    const [focus, setFocus] = useState<string | null>(null);

    return (
        <div className="h-[28rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard
                value={value}
                onChange={setValue}
                focus={focus}
                onFocusChange={setFocus}
                defaultViewport={{ x: 24, y: 24, zoom: 0.6 }}
                style={{ height: "100%", width: "100%" }}
            >
                {/* JSX content resolves to the kind:"node" piece by id. */}
                <ArtPiece id="hero-c">
                    <div className="grid h-full place-items-center bg-gradient-to-br from-emerald-400 to-teal-500 p-4 text-center text-white">
                        <div>
                            <div className="text-2xl font-bold">Live JSX</div>
                            <div className="mt-1 text-sm opacity-90">A real React node, scaled with the world transform.</div>
                            <Badge color="green" className="mt-3">kind: node</Badge>
                        </div>
                    </div>
                </ArtPiece>
            </ArtBoard>
        </div>
    );
}

function ArtPieceDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "kinds",
                title: "Three content kinds",
                pieces: [
                    {
                        id: "p-image",
                        label: "image",
                        width: 240,
                        height: 200,
                        content: { kind: "image", src: "/showcase-assets/fancy-ui-logo.jpg", alt: "Logo" },
                    },
                    {
                        id: "p-html",
                        label: "html",
                        width: 240,
                        height: 200,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                    {
                        id: "p-node",
                        label: "node (JSX)",
                        width: 240,
                        height: 200,
                        content: { kind: "node" },
                    },
                    {
                        id: "p-pending",
                        label: "pending",
                        width: 240,
                        height: 200,
                        pending: true,
                        content: { kind: "html", html: ARTBOARD_HTML_MOCKUP },
                    },
                ],
            },
        ],
    });
    return (
        <div className="h-80 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard value={value} onChange={setValue} defaultViewport={{ x: 24, y: 24, zoom: 0.7 }} style={{ height: "100%", width: "100%" }}>
                <ArtPiece id="p-node">
                    <div className="grid h-full place-items-center bg-zinc-900 p-3 text-center font-mono text-xs text-emerald-300">
                        &lt;ArtPiece&gt;{"{"} any JSX {"}"}&lt;/ArtPiece&gt;
                    </div>
                </ArtPiece>
            </ArtBoard>
        </div>
    );
}

function ArtboardSectionDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "hero",
                title: "Hero variants",
                subtitle: "A/B/C copy directions",
                pieces: [
                    { id: "h-a", label: "A", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                    { id: "h-b", label: "B", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                ],
            },
            {
                id: "pricing",
                title: "Pricing",
                subtitle: "Two layouts",
                pieces: [
                    { id: "pr-a", label: "Cards", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                    { id: "pr-b", label: "Table", width: 220, height: 300, content: { kind: "html", html: ARTBOARD_HTML_MOCKUP } },
                ],
            },
        ],
    });
    return (
        <div className="h-80 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard value={value} onChange={setValue} defaultViewport={{ x: 24, y: 24, zoom: 0.55 }} style={{ height: "100%", width: "100%" }} />
        </div>
    );
}

function ArtboardNoteDemo() {
    const [note, setNote] = useState("Try the dusk gradient on the hero?");
    return (
        <div className="h-64 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard defaultViewport={{ x: 0, y: 0, zoom: 1 }} style={{ height: "100%", width: "100%" }}>
                <ArtBoard.Note top={40} left={60} rotate={-3} value={note} onChange={setNote} editable />
                <ArtBoard.Note top={60} left={300} rotate={2} color="violet">
                    Static notes take children instead of value/onChange.
                </ArtBoard.Note>
            </ArtBoard>
        </div>
    );
}

// ─── fancy-flow ────────────────────────────────────────────────────────────

// A realistic order-handling FlowGraph. Node `type` + `data.kind` are the
// registry kind *names* (manual_trigger, api_request, branch, …) — that's how
// FlowEditor itself shapes a node (see its palette-drop handler). The branch's
// true/false output handles drive the two paths.
const flowNode = (id: string, type: string, x: number, y: number, label: string, extra: Record<string, unknown> = {}) => ({
    id,
    type,
    position: { x, y },
    data: { kind: type, label, config: {}, ...extra },
});
const FLOW_SEED_GRAPH = {
    nodes: [
        flowNode("trigger", "manual_trigger", 0, 150, "Start"),
        flowNode("fetch", "api_request", 220, 60, "Fetch order"),
        flowNode("branch", "branch", 440, 150, "Paid?"),
        flowNode("summarize", "llm_call", 680, 60, "Summarize"),
        flowNode("notify", "notify", 680, 250, "Email customer"),
        flowNode("respond", "output", 920, 150, "Respond"),
        { id: "note", type: "note", position: { x: 200, y: 300 }, data: { kind: "note", label: "Tip", body: "Drag a kind from the palette onto the canvas. Select any node to edit it on the right." } },
    ],
    edges: [
        { id: "e1", source: "trigger", target: "fetch" },
        { id: "e2", source: "fetch", target: "branch" },
        { id: "e3", source: "branch", target: "summarize", sourceHandle: "true", label: "paid" },
        { id: "e4", source: "branch", target: "notify", sourceHandle: "false", label: "unpaid" },
        { id: "e5", source: "summarize", target: "respond" },
        { id: "e6", source: "notify", target: "respond" },
    ],
};

// One wildcard executor (resolved via the registry's "*" fallback) so every
// node runs — the Run button executes the graph and streams status to the feed.
const flowSleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FLOW_EXECUTORS = {
    "*": async ({ node }: { node: { id: string } }) => {
        await flowSleep(420);
        return { node: node.id, ok: true };
    },
};

function FlowEditorDemo() {
    const [graph, setGraph] = useState(FLOW_SEED_GRAPH);
    return (
        <DemoNote
            outOfBox="The drag-to-add palette (left), the per-node config panel (select a node), the Run button + topological executor, and the live run feed below the canvas — all stock FlowEditor. Pan, zoom, connect ports, and rename inline too."
            demo="The seed graph (7 nodes across all six kinds) and four one-line example executors that just sleep + return — swap in real handlers (LLM, tool, HTTP) for production."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FlowEditor value={graph} onChange={setGraph} executors={FLOW_EXECUTORS} height={480} />
            </div>
        </DemoNote>
    );
}

function FlowStateHookDemo() {
    const [graph, setGraph] = useState(FLOW_SEED_GRAPH);
    return (
        <DemoNote
            outOfBox="useFlowState owns the controlled nodes + edges + per-node run status and wires xyflow's onNodesChange / onEdgesChange / onConnect for you — it's exactly what FlowEditor uses internally, shown here driving the same editor."
            demo="The seed graph below; see the Code tab for the bare useFlowState() call without the editor chrome."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FlowEditor value={graph} onChange={setGraph} showFeed={false} height={380} />
            </div>
        </DemoNote>
    );
}

function FlowRunHookDemo() {
    const [graph, setGraph] = useState(FLOW_SEED_GRAPH);
    return (
        <DemoNote
            outOfBox="useFlowRun drives runFlow — topological execution through your executor registry, streaming typed run events (node-status, output) plus a cancel handle. Hit Run and watch the feed below stream per-node status."
            demo="The executor registry here is four sleep-and-return stubs; the feed and status pills are the real hook output."
        >
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FlowEditor value={graph} onChange={setGraph} executors={FLOW_EXECUTORS} height={420} />
            </div>
        </DemoNote>
    );
}

// ─── fancy-sheets ──────────────────────────────────────────────────────────

// A seeded workbook exercising formulas, number/currency formatting, bold
// headers, a cell comment, and a second sheet tab. Sheets are built from the
// package's createEmptySheet() factory so every required field (columnWidths,
// row heights, …) is present — then we drop in our cells.
const cur = { displayFormat: "currency" as const, decimals: 0 };
// Build the seed by cloning the canonical sheet that createEmptyWorkbook()
// produces (so every required field — columnWidths, row heights, … — is
// present) and only overriding id / name / cells. Constructing SheetData by
// hand crashes the renderer; cloning a known-good sheet never does.
function buildSheetsSeed() {
    const wb = createEmptyWorkbook();
    const base = wb.sheets[0];
    const sales = {
        ...base,
        name: "Q1 Sales",
        cells: {
            A1: { value: "Region", format: { bold: true } },
            B1: { value: "Jan", format: { bold: true, textAlign: "right" as const } },
            C1: { value: "Feb", format: { bold: true, textAlign: "right" as const } },
            D1: { value: "Mar", format: { bold: true, textAlign: "right" as const } },
            E1: { value: "Total", format: { bold: true, textAlign: "right" as const } },
            A2: { value: "North" },
            B2: { value: 1200, format: cur }, C2: { value: 1450, format: cur }, D2: { value: 1610, format: cur },
            E2: { value: 0, formula: "SUM(B2:D2)", format: cur },
            A3: { value: "South" },
            B3: { value: 980, format: cur }, C3: { value: 1100, format: cur }, D3: { value: 1320, format: cur },
            E3: { value: 0, formula: "SUM(B3:D3)", format: cur },
            A4: { value: "Total", format: { bold: true } },
            B4: { value: 0, formula: "SUM(B2:B3)", format: { bold: true, ...cur } },
            C4: { value: 0, formula: "SUM(C2:C3)", format: { bold: true, ...cur } },
            D4: { value: 0, formula: "SUM(D2:D3)", format: { bold: true, ...cur } },
            E4: { value: 0, formula: "SUM(E2:E3)", format: { bold: true, backgroundColor: "#ecfdf5", ...cur } },
            A6: { value: "Avg / region", format: { italic: true } },
            B6: { value: 0, formula: "AVERAGE(E2:E3)", format: { italic: true, ...cur } },
        },
    };
    const notes = {
        ...base,
        id: `${base.id}-notes`,
        name: "Notes",
        cells: {
            A1: { value: "Try it", format: { bold: true } },
            A2: { value: "Edit any cell, type a formula like =SUM(B2:D2), copy/paste a range, or switch sheet tabs below." },
            A4: { value: "This cell has a comment →" },
            B4: { value: "hover the corner", comment: { text: "Comments render a corner triangle.", author: "Demo" } },
        },
    };
    return { ...wb, sheets: [sales, notes] };
}

function SheetWorkbookDemo() {
    const [wb, setWb] = useState(buildSheetsSeed);
    return (
        <DemoNote
            outOfBox="The formula engine (=SUM / =AVERAGE / …), multi-sheet tabs, bold / align / number + currency formatting, cell comments, copy-paste, undo, and the toolbar — all stock. Click a cell and type to edit; type = to start a formula."
            demo="The seeded Q1 Sales + Notes sheets."
        >
            <div className="h-96 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <SheetWorkbook data={wb} onChange={setWb} rowCount={40} columnCount={12} />
            </div>
        </DemoNote>
    );
}

function EmptyWorkbookDemo() {
    const [wb, setWb] = useState(() => createEmptyWorkbook());
    return (
        <DemoNote
            outOfBox="createEmptyWorkbook() returns a single-sheet WorkbookData you hand straight to <SheetWorkbook data={…}>. Everything below — editing, formulas, formatting, extra sheets — is the live result."
            demo="Nothing — this is the bare factory output, ready to fill in."
        >
            <div className="h-72 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <SheetWorkbook data={wb} onChange={setWb} />
            </div>
        </DemoNote>
    );
}

// ─── fancy-code ────────────────────────────────────────────────────────────

function CodeEditorDemo() {
    const [code, setCode] = useState(
        `// Pure-JS Tailwind-flavored editor — no Monaco, CodeMirror, or Shiki.\nconst greet = (name: string) => \`hi \${name}\`;\n\nconst people = ["Ada", "Claude", "the agent"];\npeople.map(greet).forEach(console.log);\n`,
    );
    return (
        <div className="overflow-hidden rounded-md">
            <CodeEditor value={code} onChange={setCode} language="typescript" theme="dark" minHeight={220} maxHeight={400}>
                <CodeEditor.Panel />
            </CodeEditor>
        </div>
    );
}

// ─── fancy-echarts ─────────────────────────────────────────────────────────

function EChartDemo() {
    return (
        <EChart
            option={{
                grid: { top: 24, left: 48, right: 12, bottom: 32 },
                tooltip: { trigger: "axis" },
                xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
                yAxis: { type: "value" },
                series: [
                    { type: "bar", name: "ARR", data: [12000, 18500, 22000, 26500], itemStyle: { color: "#8b5cf6" } },
                ],
            }}
            style={{ height: 320 }}
        />
    );
}

// (DataDiagram / Flowchart / Mindmap / OrgChart demos removed alongside the
//  fancy-echarts 4.0.0 deletion of the hand-rolled diagram subsystem. Use
//  @particle-academy/fancy-flow for node-edge graphs now.)

// ─── fancy-screens ─────────────────────────────────────────────────────────

function ScreenSystemDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Top-level provider that owns the screen registry + cross-screen agent presence. Mount once near the app root; every <code>&lt;Screen&gt;</code> inside becomes addressable.
            </Text>
            <ScreenSystem>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Screen id="onboarding" title="Onboarding">
                        <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="font-semibold">Onboarding</div>
                            <div className="mt-1 text-xs text-zinc-500">id: onboarding</div>
                        </div>
                    </Screen>
                    <Screen id="settings" title="Settings">
                        <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="font-semibold">Settings</div>
                            <div className="mt-1 text-xs text-zinc-500">id: settings</div>
                        </div>
                    </Screen>
                </div>
            </ScreenSystem>
        </div>
    );
}

function ScreenDemo() {
    return (
        <ScreenSystem>
            <Screen id="dashboard" title="Dashboard">
                <div className="rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="text-sm font-semibold">Dashboard</div>
                    <Text size="xs" className="mt-1 !text-zinc-500">
                        Registered screen. id=<code>dashboard</code>. Agents address this surface by id; activity flows up to the ScreenSystem.
                    </Text>
                </div>
            </Screen>
        </ScreenSystem>
    );
}

// ─── fancy-3d ──────────────────────────────────────────────────────────────

function Fancy3DCanvasDemo() {
    return (
        <div className="space-y-2">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Engine-pluggable 3D canvas. <code>engine="dom"</code> renders a CSS-3D mode with no Babylon dep; <code>engine="babylon"</code> spins up a full WebGL scene. Same JSX inside.
            </Text>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <Canvas engine="dom" style={{ height: 280 }} />
            </div>
        </div>
    );
}

// Lazy-load the WebGL demos so Babylon (~13MB) / three only load when a visitor
// actually opens one of the fancy-3d-babylon / fancy-3d-three component pages.
const BabylonDemo = lazy(() => import("./ComponentDocs/Fancy3D.babylon-demo"));
const ThreeDemo = lazy(() => import("./ComponentDocs/Fancy3D.three-demo"));

function WebGLFrame({ engine, example }: { engine: "babylon" | "three"; example: "stage" | "monitor" | "card3d" }) {
    const D = engine === "babylon" ? BabylonDemo : ThreeDemo;
    return (
        <Suspense
            fallback={
                <div className="grid h-72 w-full place-items-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700">
                    Loading {engine === "babylon" ? "Babylon" : "three.js"} engine…
                </div>
            }
        >
            <D example={example} />
        </Suspense>
    );
}

function Fancy3DStageDemo() { return <WebGLFrame engine="babylon" example="stage" />; }
function Fancy3DMonitorDemo() { return <WebGLFrame engine="babylon" example="monitor" />; }
function Fancy3DCard3DDemo() { return <WebGLFrame engine="babylon" example="card3d" />; }
function Fancy3DThreeStageDemo() { return <WebGLFrame engine="three" example="stage" />; }
function Fancy3DThreeMonitorDemo() { return <WebGLFrame engine="three" example="monitor" />; }
function Fancy3DThreeCard3DDemo() { return <WebGLFrame engine="three" example="card3d" />; }

// ─── agent-integrations ────────────────────────────────────────────────────

function MicroMcpServerDemo() {
    return (
        <Explainer
            kind="server-side"
            summary="The Human+ UX core: a tiny MCP server that runs inside the browser tab. Bridges register typed tools against it; transports (in-process, SSE-relay) let local and remote agents call them. Headless by design — no React render."
            code={'import { MicroMcpServer, attachInProcess } from "@particle-academy/agent-integrations";\n\nconst server = new MicroMcpServer({\n  info: { name: "my-app-session", version: "0.1.0" },\n});\n\nattachInProcess(server);  // for an agent rendered in the same React tree\n// or attachSseRelay(server, { baseUrl, sessionId, token }) for remote agents'}
            bullets={[
                "Owns the tool registry — bridges call server.registerTool(...).",
                "Transports are pluggable — in-process, SSE relay, or your own.",
                "One server per session; persists across Inertia navigations when mounted in FancyAppRoot.",
            ]}
        />
    );
}

function AgentPanelDemo() {
    return (
        <div className="max-w-sm">
            <AgentPanel
                agents={[
                    { id: "claude", name: "Claude", color: "#a855f7", status: "active" as const, lastActivity: { kind: "write", at: Date.now() - 1500, target: "Onboarding sticky" } },
                    { id: "scribe", name: "Scribe", color: "#10b981", status: "idle" as const, lastActivity: { kind: "read", at: Date.now() - 28000, target: "deck-1 · slide 3" } },
                ]}
            />
        </div>
    );
}

function AgentCursorDemo() {
    return (
        <div className="space-y-3">
            <div className="relative h-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "30%", top: "40%" }}>
                    <span className="block h-3 w-3 animate-pulse rounded-full bg-violet-500" style={{ boxShadow: "0 0 0 4px rgba(168,85,247,0.2)" }} />
                    <span className="absolute left-3 top-3 whitespace-nowrap rounded bg-violet-500 px-1.5 py-0.5 text-[10px] text-white">Claude · drawing</span>
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "70%", top: "65%" }}>
                    <span className="block h-3 w-3 animate-pulse rounded-full bg-emerald-500" style={{ boxShadow: "0 0 0 4px rgba(16,185,129,0.2)" }} />
                    <span className="absolute left-3 top-3 whitespace-nowrap rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] text-white">Scribe · idle</span>
                </div>
            </div>
            <Text size="xs" className="!text-zinc-500">
                Real <code className="font-mono">&lt;AgentCursor&gt;</code> takes id, color, position, label, intent.
                Hook into a CursorLayer (whiteboard) or place loose over any container.
            </Text>
        </div>
    );
}

function SharedWhiteboardDemo() {
    return (
        <Explainer
            kind="server-side"
            summary="One-line composite: renders fancy-whiteboard's Board, mounts the MCP server, registers the whiteboard bridge, and wires the SSE share relay. Demoed live at /react-demos/whiteboard-shared. Copy the share URL, paste into Claude Code, and the agent joins."
            code={'import { SharedWhiteboard } from "@particle-academy/agent-integrations/components/shared-whiteboard";\nimport "@particle-academy/agent-integrations/styles.css";\nimport "@particle-academy/fancy-whiteboard/styles.css";\n\n<SharedWhiteboard\n  agent={{ id: "claude", name: "Claude", color: "#a855f7" }}\n  relayBaseUrl="https://relay.particle.academy"\n/>'}
        />
    );
}

function ShareControlsDemo() {
    const [sharing, setSharing] = useState(false);
    return (
        <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <span className={`inline-block h-2 w-2 rounded-full ${sharing ? "animate-pulse bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className="text-sm">{sharing ? "Sharing · session active" : "Not shared"}</span>
                <div className="ml-auto">
                    {sharing ? (
                        <Button size="sm" color="red" variant="ghost" onClick={() => setSharing(false)}>Stop</Button>
                    ) : (
                        <Button size="sm" color="violet" onClick={() => setSharing(true)}>Start sharing</Button>
                    )}
                </div>
            </div>
            {sharing && (
                <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-[11px] text-zinc-100">
                    https://relay.particle.academy/sess-7f3a/events?token=…
                </pre>
            )}
            <Text size="xs" className="!text-zinc-500">
                Real <code className="font-mono">&lt;ShareControls&gt;</code> registers a session against the relay broker, copies the share URL to the clipboard, and emits state for the agent panel.
            </Text>
        </div>
    );
}

// ─── holy-sheet (PHP) ──────────────────────────────────────────────────────

function HolySheetAgentDemo() {
    return (
        <Explainer
            kind="php"
            language="php"
            summary="PHP 8.2+ xlsx writer for agentic document creation — framework-agnostic core with an optional Laravel adapter. The Agent class is the top-level write / describe / validateAndRepair / lint entry point."
            code={`<?php

use HolySheet\\Agent;

$schema = [
  'sheets' => [[
    'name' => 'Q1',
    'columns' => [
      ['header' => 'Region',  'type' => 'string'],
      ['header' => 'Revenue', 'type' => 'currency', 'currency' => 'USD'],
    ],
    'rows' => [
      ['NA', 12000],
      ['EU', 18500],
      ['APAC', 9400],
    ],
  ]],
];

Agent::write($schema, storage_path('app/q1.xlsx'));

// Round-trip:
$back = Agent::describe(storage_path('app/q1.xlsx'));
// $back === $schema (modulo formatting metadata)`}
            bullets={[
                "Zero third-party deps; only requires ext-zip.",
                "Round-trip safe — describe() returns the same schema write() consumed.",
                "Optional FMS integration via the Laravel adapter.",
            ]}
        />
    );
}

// ─── fancy-inertia ─────────────────────────────────────────────────────────

function FancyAppRootDemo() {
    // FancyAppRoot is the provider already mounted at the showcase entry —
    // every page on this site renders inside it. We can prove it's live by
    // firing a toast (Toast.Provider lives inside FancyAppRoot).
    const toast = useToast();
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Provider mounted at this site's <code>createInertiaApp.setup</code>. It owns Toast.Provider, fancy-screens' ScreenSystem, and echarts module registration — survives Inertia page swaps. Tap the button to fire a real toast through the live provider.
            </Text>
            <Button
                onClick={() =>
                    toast.success({
                        title: "Hello from FancyAppRoot",
                        description: "This toast bubbled through the live Toast.Provider that FancyAppRoot mounts.",
                    })
                }
            >
                Fire a toast
            </Button>
        </div>
    );
}

const CONTENT_DOC = {
    type: "doc",
    content: [
        { type: "heading", level: 2, text: "Hello" },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "Body text with a " },
                { type: "text", marks: ["bold"], text: "bold" },
                { type: "text", text: " span and an " },
                { type: "text", marks: ["italic"], text: "italic" },
                { type: "text", text: " one." },
            ],
        },
        { type: "code_block", lang: "ts", text: "const greet = (n) => 'hi ' + n;" },
        {
            type: "bullet_list",
            content: [
                { type: "list_item", content: [{ type: "paragraph", content: [{ type: "text", text: "Plain JSON — easy for agents to author." }] }] },
                { type: "list_item", content: [{ type: "paragraph", content: [{ type: "text", text: "Round-trips with Editor — same shape." }] }] },
            ],
        },
    ],
};

function ContentRendererDemo() {
    return (
        <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <ContentRenderer document={CONTENT_DOC} />
        </div>
    );
}

function EditorDemo() {
    const [doc, setDoc] = useState(CONTENT_DOC);
    return (
        <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <Editor
                value={doc}
                onChange={setDoc}
                toolbar={[
                    { command: "bold", label: "B" },
                    { command: "italic", label: "I" },
                    { command: "heading", commandArg: "2", label: "H2" },
                    { command: "bulletList", label: "•" },
                    { command: "codeBlock", label: "</>" },
                ]}
            />
        </div>
    );
}

function UseFancyFormDemo() {
    // useFancyForm wraps Inertia's useForm() and exposes .field(name) for
    // drop-in react-fancy <Input> props. Mocking a tiny version locally
    // keeps the demo working on Component pages even without a real
    // server-validated form context.
    type Field = { value: string; onChange: (v: string) => void; error?: string };
    const [data, setData] = useState({ url: "", title: "" });
    const [errors, setErrors] = useState<{ url?: string; title?: string }>({});
    const field = (name: keyof typeof data): Field => ({
        value: data[name],
        onChange: (v) => setData((d) => ({ ...d, [name]: v })),
        error: errors[name],
    });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const next: typeof errors = {};
        if (!data.url) next.url = "URL is required";
        if (data.url && !data.url.startsWith("http")) next.url = "Must start with http(s)://";
        setErrors(next);
    };
    return (
        <form onSubmit={submit} className="max-w-md space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                <code>useFancyForm()</code> wraps Inertia <code>useForm()</code> with a <code>.field(name)</code> helper that drops straight into react-fancy <code>&lt;Input&gt;</code>. Below is the spread pattern, with a tiny in-memory stub so you can try the error-binding.
            </Text>
            <Input {...field("url")} label="URL" placeholder="https://example.com" />
            <Input {...field("title")} label="Title (optional)" />
            <Button type="submit">Submit</Button>
        </form>
    );
}

// ─── fancy-slides ──────────────────────────────────────────────────────────
//
// Every detail demo here renders the SAME canonical slide/deck the tile
// renders (see showcase-fixtures.tsx). The detail page just shows it bigger
// + adds interactive controls (fullscreen toggle, fit-mode grid, etc.) so
// the click-through transition feels continuous.

function FsSlideRegistryDemo() {
    return (
        <div className="space-y-4">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                The shared single-slide renderer — same slide JSON, multiple container sizes. Resolution independence comes from 0..1 fractional coords; theme swaps fonts + colors.
            </Text>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">theme=&quot;default&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={420} />
                    </div>
                </div>
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">theme=&quot;dark&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide slide={CANONICAL_SLIDE} theme={fsDarkTheme} width={420} />
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-3">
                <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={240} />
                </div>
                <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={160} />
                </div>
                <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={100} />
                </div>
            </div>
        </div>
    );
}

function FsSlideViewerRegistryDemo() {
    const [fullscreen, setFullscreen] = useState(false);
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Read-only deck player. Same {CANONICAL_DECK.slides.length}-slide deck as the package tile, mounted full-size. Click into the viewer below, then try ←/→ / Space / Home / End / 1-{CANONICAL_DECK.slides.length} / B / F / Esc.
            </Text>
            <Button color="violet" size="sm" icon="play" onClick={() => setFullscreen(true)}>
                Open fullscreen
            </Button>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="h-[420px] w-full bg-black">
                    <FsSlideViewer deck={CANONICAL_DECK} />
                </div>
            </div>
            {fullscreen && (
                <div className="fixed inset-0 z-50 bg-black">
                    <FsSlideViewer deck={CANONICAL_DECK} onExit={() => setFullscreen(false)} />
                </div>
            )}
        </div>
    );
}

function FsPresenterViewRegistryDemo() {
    const [popout, setPopout] = useState(false);
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Speaker-only second-monitor view of the same canonical deck. Current slide + next slide preview + speaker notes + wall clock + elapsed timer.
            </Text>
            <Button color="violet" size="sm" icon="presentation" onClick={() => setPopout(true)}>
                Pop out
            </Button>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="h-[520px] w-full">
                    <FsPresenterView deck={CANONICAL_DECK} />
                </div>
            </div>
            {popout && (
                <div className="fixed inset-0 z-50 bg-black">
                    <FsPresenterView deck={CANONICAL_DECK} onExit={() => setPopout(false)} />
                </div>
            )}
        </div>
    );
}

function FsDeckEditorRegistryDemo() {
    // Real, live editor. Same canonical deck as the rest of the showcase —
    // edit the slide, drag elements, add new ones from the toolbar, reorder
    // in the rail. Mutations are op-based; the local state below is the
    // canonical "consumer owns the deck" pattern.
    const [deck, setDeck] = useState<FsDeck>(CANONICAL_DECK);
    const [opCount, setOpCount] = useState(0);
    const [presenting, setPresenting] = useState(false);

    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Full live editor — toolbar / slide rail / canvas / inspector / speaker notes. Drag elements, edit text inline, reorder slides in the rail, add new elements from the toolbar, hit ▶ Present to launch the SlideViewer fullscreen. Every mutation flows through the same `DeckOp` enum the agent bridge speaks, so humans and agents drive identical operations.
            </Text>
            <div className="flex items-center gap-2 text-xs">
                <Badge color="violet">{deck.slides.length} slides</Badge>
                <Badge color="zinc">{opCount} ops applied</Badge>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setDeck(CANONICAL_DECK);
                        setOpCount(0);
                    }}
                >
                    Reset
                </Button>
            </div>
            <div className="h-[640px] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FsDeckEditor
                    value={deck}
                    onChange={setDeck}
                    onOp={() => setOpCount((n) => n + 1)}
                    onPresent={() => setPresenting(true)}
                    toolbarExtra={<PptxExportControl deck={deck as unknown as { title?: string } & Record<string, unknown>} />}
                />
            </div>
            {presenting && (
                <div className="fixed inset-0 z-50 bg-black">
                    <FsSlideViewer deck={deck} onExit={() => setPresenting(false)} />
                </div>
            )}
            <Explainer
                summary="DeckEditor is controlled (value + onChange). The host owns the deck; the editor renders a view and dispatches ops. Since 0.6.0 it renders every element type — text / image / shape / chart / code / table / embed — out of the box; pass your own `renderElement` only to override."
                code={'import { DeckEditor, defaultTheme } from "@particle-academy/fancy-slides";\nimport "@particle-academy/fancy-slides/styles.css";\n\nconst [deck, setDeck] = useState({\n  id: "doc-1",\n  title: "My deck",\n  theme: defaultTheme,\n  slides: [/* … */],\n});\n\n// Full editor out of the box — chart/code/table/embed render by default.\n<DeckEditor value={deck} onChange={setDeck} onOp={(op) => activityLog.push(op)} />'}
                bullets={[
                    "Compose your own layout by importing SlideRail / EditorToolbar / ElementInspector / SpeakerNotes individually.",
                    "Agent-bridgeable — the same DeckOp stream powers human + agent mutations.",
                    "Hide any panel via hideRail / hideToolbar / hideInspector / hideNotes for embedded contexts.",
                ]}
            />
        </div>
    );
}

function FsTextElementRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Text elements render through react-fancy&apos;s ContentRenderer in markdown mode — `## headings`, **bold**, *italic*, and bulleted lists. The tile shows this exact slide; the detail page shows it at full size plus a `plain` variant.
            </Text>
            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">format=&quot;markdown&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide slide={CANONICAL_TEXT_SLIDE} theme={fsDefaultTheme} />
                    </div>
                </div>
                <div>
                    <Text size="xs" className="mb-1 !font-mono !text-zinc-500">format=&quot;plain&quot;</Text>
                    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                        <FsSlide
                            slide={{
                                id: "plain",
                                elements: [{
                                    id: "t", type: "text",
                                    x: 0.06, y: 0.2, w: 0.88, h: 0.6,
                                    content: "A simple line of text — newlines preserved.\nNo markdown.",
                                    format: "plain",
                                    style: { fontSize: 28, align: "center", verticalAlign: "middle" },
                                }],
                                background: { color: "#ffffff" },
                            }}
                            theme={fsDefaultTheme}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FsImageElementRegistryDemo() {
    const fits: Array<{
        fit: "contain" | "cover" | "fill" | "scale-down";
        explainer: string;
    }> = [
        { fit: "contain", explainer: "Preserves source aspect; letterboxes top + bottom." },
        { fit: "cover", explainer: "Preserves source aspect; crops left + right to fill." },
        { fit: "fill", explainer: "Stretches to fill the box — distorts the image." },
        { fit: "scale-down", explainer: "Same as contain when source is larger than the box." },
    ];
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Image elements use object-fit. The source below is a wide 1400×900 screenshot of react-fancy; each box is intentionally tall + narrow so the four fit modes show dramatically different results.
            </Text>
            <div className="grid gap-3 sm:grid-cols-2">
                {fits.map(({ fit, explainer }) => (
                    <div key={fit}>
                        <div className="mb-1 flex items-baseline gap-2">
                            <Text size="xs" className="!font-mono !text-zinc-500">fit=&quot;{fit}&quot;</Text>
                            <Text size="xs" className="!text-zinc-400">{explainer}</Text>
                        </div>
                        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                            <FsSlide
                                slide={{
                                    id: `img-${fit}`,
                                    elements: [{
                                        id: "img",
                                        type: "image",
                                        ...CANONICAL_IMAGE_BOX,
                                        src: CANONICAL_IMAGE_SRC,
                                        fit,
                                    }],
                                    background: { color: "#f8fafc" },
                                }}
                                theme={fsDefaultTheme}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FsShapeElementRegistryDemo() {
    const kinds: Array<"rect" | "rounded-rect" | "ellipse" | "triangle" | "line" | "arrow"> = [
        "rect", "rounded-rect", "ellipse", "triangle", "line", "arrow",
    ];
    return (
        <div className="space-y-4">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                The package tile shows three shapes wired as an input → process → output composition. Below: the canonical composition at full size, then every supported shape kind in its own slide.
            </Text>
            <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                <FsSlide slide={CANONICAL_SHAPES_SLIDE} theme={fsDefaultTheme} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kinds.map((kind) => (
                    <div key={kind}>
                        <Text size="xs" className="mb-1 !font-mono !text-zinc-500">shape=&quot;{kind}&quot;</Text>
                        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                            <FsSlide
                                slide={{
                                    id: `shape-${kind}`,
                                    elements: [{
                                        id: "s", type: "shape", shape: kind,
                                        x: 0.15, y: 0.15, w: 0.7, h: 0.7,
                                        fill: kind === "line" ? "none" : "rgba(139,92,246,0.18)",
                                        stroke: "#8B5CF6",
                                        strokeWidth: 2,
                                    }],
                                    background: { color: "#ffffff" },
                                }}
                                theme={fsDefaultTheme}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── dark-slide (PHP) ──────────────────────────────────────────────────────

function DarkSlideAgentRegistryDemo() {
    return (
        <Explainer
            kind="php"
            language="php"
            summary={'Top-level static surface for the PPTX writer. Same Agent::write call the package tile illustrates — single class with validate / write / toBytes / read / describe / validateAndRepair / jsonSchema. Framework-agnostic; optional Laravel facade.'}
            code={'<?php\n\nuse DarkSlide\\Agent;\n\n$deck = [\n  \'id\' => \'' + CANONICAL_DECK.id + '\',\n  \'title\' => \'' + CANONICAL_DECK.title + '\',\n  \'theme\' => [\'name\' => \'default\'],\n  \'slides\' => [/* ' + CANONICAL_DECK.slides.length + ' slides matching the canonical Deck */],\n];\n\n$result = Agent::write($deck, storage_path(\'app/' + CANONICAL_DECK.id + '.pptx\'));\n// => [\'path\' => \'…\', \'bytes\' => 6291, \'slides\' => ' + CANONICAL_DECK.slides.length + ']\n\n// Round-trip back to JSON:\n$back = Agent::read(storage_path(\'app/' + CANONICAL_DECK.id + '.pptx\'));\n\n// Plain-text summary for an agent:\necho Agent::describe($deck);\n\n// LLM tool registration:\n$schema = Agent::jsonSchema();'}
            bullets={[
                "Zero third-party deps. ext-zip + ext-dom only.",
                "validateAndRepair() returns recoverable feedback for LLM tool loops.",
                "Round-trip safe for v0.2+ features: tables, gradients, embedded images, inline markdown spans.",
            ]}
        />
    );
}

function DarkSlidePptxWriterRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Office Open XML writer. Produces a real .pptx that opens cleanly in PowerPoint / Keynote / Google Slides / LibreOffice Impress. Coverage matrix matches the tile.
            </Text>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {PPTX_WRITER_COVERAGE.map((c) => (
                    <div
                        key={c.label}
                        className={`rounded border px-2 py-3 text-center ${
                            c.check
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                                : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                        }`}
                    >
                        <div className="font-mono text-xs">{c.label}</div>
                        <div className="text-base font-semibold">{c.check ? "✓" : c.note ?? "—"}</div>
                    </div>
                ))}
            </div>
            <Explainer
                summary={'Element types map to drawingML shapes: text → <p:sp>+<p:txBody>, image → <p:pic>+blipFill, shape → <p:sp>+<a:prstGeom>, table → <p:graphicFrame>+<a:tbl>, code → colored runs inside a dark-filled <p:sp>.'}
                code={'use DarkSlide\\Writer\\PptxWriter;\n\n$writer = new PptxWriter();\n\n$bytes = $writer->toBytes($deck);\n// or:\n$writer->write($deck, $path);  // writes to disk + returns size'}
                bullets={[
                    "Coords convert from 0..1 fractions to PPTX EMU (914,400 per inch).",
                    "Themes drive theme1.xml (font scheme + color scheme).",
                    "Speaker notes ship as ppt/notesSlides/notesSlideN.xml.",
                    "v0.3 ships markdown headings + syntax-highlighted code (JS/TS, PHP, JSON, bash, CSS, Python, HTML).",
                ]}
            />
        </div>
    );
}

function DarkSlidePptxReaderRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                PPTX → Deck schema extractor. Agent-emitted decks round-trip with high fidelity; hand-authored PowerPoint files drop styling the schema can&apos;t represent. The tile&apos;s &quot;deck.pptx → Deck JSON&quot; flow expands here.
            </Text>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-center font-mono dark:border-zinc-700 dark:bg-zinc-900">
                    deck.pptx
                </div>
                <span className="text-zinc-400">→</span>
                <div className="rounded border border-violet-300 bg-violet-50 p-3 text-center font-mono text-violet-700 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    Deck JSON
                </div>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PPTX_READER_ROUNDTRIP.map((line) => (
                    <li key={line} className="flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100">
                        <span>✓</span>
                        <span className="font-mono">{line}</span>
                    </li>
                ))}
            </ul>
            <Explainer
                summary={'fromBytes() lets you read uploaded PPTX bytes directly without a temp file. read() is the convenience for path-based reads.'}
                code={'use DarkSlide\\Reader\\PptxReader;\n\n$reader = new PptxReader();\n\n$deck = $reader->read($path);\n// or:\n$deck = $reader->fromBytes($bytes);\n\n// $deck shape matches the writer\'s input exactly:\n// [ \'id\', \'title\', \'theme\', \'slides\' => […] ]'}
            />
        </div>
    );
}

function DarkSlideSyntaxHighlighterRegistryDemo() {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Pure-PHP code tokenizer used by the writer to ship per-token colored `&lt;a:r&gt;` runs inside code blocks. The package tile shows this exact code; the detail page shows the tokenized result the writer would emit.
            </Text>
            <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 font-mono text-sm leading-relaxed">
                <code>
                    {CANONICAL_HIGHLIGHTED_TOKENS.map((tok, i) => (
                        <span key={i} className={HIGHLIGHT_KIND_COLOR[tok.kind] ?? "text-slate-100"}>
                            {tok.text}
                        </span>
                    ))}
                </code>
            </pre>
            <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(HIGHLIGHT_KIND_COLOR).map(([kind, cls]) => (
                    <span key={kind} className="rounded border border-zinc-200 bg-white px-2 py-0.5 dark:border-zinc-700 dark:bg-zinc-900">
                        <span className={cls + " font-mono"}>{kind}</span>
                    </span>
                ))}
            </div>
            <Explainer
                summary={'tokenize($code, $language) returns [{ text, kind }, …]. colorFor($kind) returns a 6-digit hex string to drop into <a:srgbClr val="…"/>.'}
                code={'use DarkSlide\\Helpers\\SyntaxHighlighter;\n\n$tokens = SyntaxHighlighter::tokenize(\n    "' + CANONICAL_HIGHLIGHTED_CODE.replace(/\n/g, '\\n').replace(/"/g, '\\"') + '",\n    "typescript",\n);\n\n// $tokens contains one entry per token:\n//   [\'text\' => \'const\', \'kind\' => \'keyword\'],\n//   [\'text\' => \' greet \', \'kind\' => \'plain\'],\n//   …\n\n// Map kind → hex for drawingML:\n$hex = SyntaxHighlighter::colorFor(\'keyword\');\n// => \'C084FC\''}
                bullets={[
                    "Languages: javascript, typescript, jsx, tsx, php, json, bash, css, python, html.",
                    "Kinds: keyword / string / comment / number / builtin / punctuation / plain.",
                    "Palette is tuned for the writer's dark code-block fill (#0F172A).",
                ]}
            />
        </div>
    );
}
