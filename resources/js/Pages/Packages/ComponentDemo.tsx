import { useRef, useState } from "react";
import {
    Accordion,
    Action,
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
    ContextMenu,
    Dropdown,
    Emoji,
    EmojiSelect,
    FileUpload,
    Heading,
    Icon,
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

    // ── fancy-3d
    "fancy-3d/canvas": Fancy3DCanvasDemo,
    "fancy-3d/stage": Fancy3DStageDemo,
    "fancy-3d/monitor": Fancy3DMonitorDemo,
    "fancy-3d/card-3d": Fancy3DCard3DDemo,

    // ── agent-integrations
    "agent-integrations/micro-mcp-server": MicroMcpServerDemo,
    "agent-integrations/agent-panel": AgentPanelDemo,
    "agent-integrations/agent-cursor": AgentCursorDemo,
    "agent-integrations/shared-whiteboard": SharedWhiteboardDemo,
    "agent-integrations/share-controls": ShareControlsDemo,

    // ── holy-sheet (PHP — code-snippet only)
    "holy-sheet/agent": HolySheetAgentDemo,

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

function ActionDemo() {
    return (
        <div className="flex flex-wrap gap-2">
            <Action color="violet">Primary</Action>
            <Action>Default</Action>
            <Action variant="ghost">Ghost</Action>
            <Action color="emerald" icon="check">Save</Action>
            <Action color="red" variant="ghost" icon="trash">Delete</Action>
            <Action disabled>Disabled</Action>
            <Action variant="circle" icon="search" aria-label="Search" />
            <Action variant="circle" color="violet" icon="plus" aria-label="New" />
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
                    <Action variant="ghost" size="sm" onClick={() => setV((x) => Math.max(0, x - 10))}>−10</Action>
                    <Action variant="ghost" size="sm" onClick={() => setV((x) => Math.min(100, x + 10))}>+10</Action>
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
                Flux removed, Inertia + react-fancy chrome live.
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
                <Action variant="circle" icon="star" aria-label="Pin" />
            </Tooltip>
            <Tooltip content="Tooltips appear on hover">
                <Action>Hover me</Action>
            </Tooltip>
        </div>
    );
}

function PopoverDemo() {
    return (
        <Popover>
            <Popover.Trigger>
                <Action>Open popover</Action>
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
            <Action onClick={() => toast({ title: "Saved", description: "Your changes are live." })}>
                Show toast
            </Action>
            <Action color="emerald" onClick={() => toast({ title: "Deploy succeeded", variant: "success" })}>
                Success
            </Action>
            <Action color="red" onClick={() => toast({ title: "Couldn't reach API", variant: "error" })}>
                Error
            </Action>
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
            <Action color="violet" onClick={() => setOpen(true)}>Open modal</Action>
            <Modal open={open} onClose={() => setOpen(false)} size="md">
                <Modal.Header>Are you sure?</Modal.Header>
                <Modal.Body>
                    <Text size="sm">This will archive the dream. You can restore it later from the archived list.</Text>
                </Modal.Body>
                <Modal.Footer>
                    <Action variant="ghost" onClick={() => setOpen(false)}>Cancel</Action>
                    <Action color="red" onClick={() => setOpen(false)}>Archive</Action>
                </Modal.Footer>
            </Modal>
        </>
    );
}

function DropdownDemo() {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <Action>Open menu</Action>
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
            <Action color="violet" onClick={() => setOpen(true)}>Open ⌘K</Action>
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
            <Action onClick={() => setOpen(true)}>Open mobile menu</Action>
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
            <Action size="sm" color="violet">Sign up</Action>
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
        { id: "c4", column: "done", title: "Flux → Inertia chrome" },
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
}: {
    summary: string;
    code?: string;
    bullets?: string[];
}) {
    return (
        <div className="space-y-3">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">{summary}</Text>
            {bullets && (
                <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
            )}
            {code && (
                <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-[12px] leading-relaxed text-zinc-100">
                    <code>{code}</code>
                </pre>
            )}
        </div>
    );
}

// ─── fancy-whiteboard ──────────────────────────────────────────────────────

function WhiteboardBoardDemo() {
    return (
        <Explainer
            summary="Root canvas — owns viewport pan/zoom and renders all items (sticky notes, drawings, connectors, shapes) plus an optional cursor layer."
            code={`import { Board, StickyNote, CursorLayer } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";

<Board
  notes={notes} onNotesChange={setNotes}
  viewport={viewport} onViewportChange={setViewport}
>
  <StickyNote />
  <CursorLayer cursors={cursors} />
</Board>`}
        />
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

// ─── fancy-flow ────────────────────────────────────────────────────────────

function FlowEditorDemo() {
    return (
        <Explainer
            summary="Workflow editor on top of React Flow. Renders nodes from a JSON graph, lets users wire edges, and runs the graph through a pluggable executor that emits per-node status events."
            code={'import { FlowEditor } from "@particle-academy/fancy-flow";\nimport "@particle-academy/fancy-flow/styles.css";\n\n<FlowEditor\n  initialNodes={nodes}\n  initialEdges={edges}\n  nodeKinds={[\n    { kind: "manual_trigger", label: "Manual run" },\n    { kind: "llm_call",       label: "LLM call" },\n    { kind: "tool_call",      label: "Tool" },\n    { kind: "output",         label: "Output" },\n  ]}\n  executors={DEMO_EXECUTORS}\n  onChange={({ nodes, edges }) => setGraph({ nodes, edges })}\n/>'}
        />
    );
}

function FlowStateHookDemo() {
    return (
        <Explainer
            summary="Controlled-state hook for FlowEditor. Owns nodes + edges + selection + per-node status; returns setters and the change handler you pass into <FlowEditor>."
            code={'import { useFlowState } from "@particle-academy/fancy-flow";\n\nconst flow = useFlowState(SEED_GRAPH);\n\n<FlowEditor\n  initialNodes={flow.nodes}\n  initialEdges={flow.edges}\n  onChange={flow.onChange}\n/>\n\nflow.setNodes(...)\nflow.setNodeStatus("llm-1", "running");'}
        />
    );
}

function FlowRunHookDemo() {
    return (
        <Explainer
            summary="Topological executor hook. Runs a graph through your executors map, emits a stream of typed events (log, status, output), and gives you a cancel handle."
            code={'import { useFlowRun } from "@particle-academy/fancy-flow";\n\nconst runner = useFlowRun();\n\nawait runner.run(graph, executors);\nrunner.cancel();\n\nrunner.onEvent((e) => {\n  // { type: "status" | "log" | "output", nodeId, ... }\n});'}
        />
    );
}

// ─── fancy-sheets ──────────────────────────────────────────────────────────

function SheetWorkbookDemo() {
    return (
        <Explainer
            summary="Multi-sheet spreadsheet workbook with formulas, clipboard, CSV import/export, and bridgeable cell-level state. Zero third-party deps."
            code={'import { SheetWorkbook, createEmptyWorkbook } from "@particle-academy/fancy-sheets";\nimport "@particle-academy/fancy-sheets/styles.css";\n\nconst [wb, setWb] = useState(createEmptyWorkbook());\n\n<SheetWorkbook\n  value={wb}\n  onChange={setWb}\n/>'}
        />
    );
}

function EmptyWorkbookDemo() {
    return (
        <Explainer
            summary="Factory that returns a blank single-sheet workbook with default column widths + row heights. Cheap to call; the workbook is plain JSON."
            code={'import { createEmptyWorkbook } from "@particle-academy/fancy-sheets";\n\nconst wb = createEmptyWorkbook({\n  sheets: [{ name: "Q1", rows: 100, cols: 26 }],\n});\n\n// shape:\n// { sheets: [{ id, name, cells: {}, columnWidths, rowHeights }] }'}
        />
    );
}

// ─── fancy-code ────────────────────────────────────────────────────────────

function CodeEditorDemo() {
    return (
        <Explainer
            summary="Lightweight embedded code editor — custom engine, no Monaco / CodeMirror / Shiki. Tiny bundle, controlled value, pluggable languages and themes."
            code={'import { CodeEditor } from "@particle-academy/fancy-code";\nimport "@particle-academy/fancy-code/styles.css";\n\nconst [code, setCode] = useState("const greet = (n) => \'hi \' + n;");\n\n<CodeEditor\n  value={code}\n  onChange={setCode}\n  language="typescript"\n  theme="github-dark"\n/>'}
        />
    );
}

// ─── fancy-echarts ─────────────────────────────────────────────────────────

function EChartDemo() {
    return (
        <Explainer
            summary="Typed React wrapper around Apache ECharts. Pass an ECharts option JSON object; the wrapper handles mount, resize, and SSR boundaries."
            code={'import { EChart } from "@particle-academy/fancy-echarts";\n\n<EChart\n  option={{\n    xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },\n    yAxis: { type: "value" },\n    series: [{ type: "bar", data: [12000, 18500, 22000, 26500] }],\n  }}\n  style={{ height: 320 }}\n/>'}
        />
    );
}

// (DataDiagram / Flowchart / Mindmap / OrgChart demos removed alongside the
//  fancy-echarts 4.0.0 deletion of the hand-rolled diagram subsystem. Use
//  @particle-academy/fancy-flow for node-edge graphs now.)

// ─── fancy-screens ─────────────────────────────────────────────────────────

function ScreenSystemDemo() {
    return (
        <Explainer
            summary="Top-level provider that owns the screen registry, the map of registered Zustand stores, and cross-screen agent presence. Mount once near the app root."
            code={'import { ScreenSystem } from "@particle-academy/fancy-screens";\n\n<ScreenSystem>\n  <App />          {/* Screens registered inside the tree become addressable */}\n</ScreenSystem>'}
            bullets={[
                "Single source of truth for which screens exist.",
                "Tracks Zustand stores registered via useRegisterStore() so agents can enumerate per-screen state.",
                "Used by agent-integrations to broadcast cross-screen agent activity.",
            ]}
        />
    );
}

function ScreenDemo() {
    return (
        <Explainer
            summary="A registered screen container. Owns a stable id, an optional schema, and a meta channel that surfaces agent activity to the system."
            code={'import { Screen } from "@particle-academy/fancy-screens";\n\n<Screen id="onboarding" title="Onboarding overhaul">\n  {/* page content */}\n</Screen>'}
            bullets={[
                "id is the stable handle agents address.",
                "meta.agentActivity is wired automatically when bridges are mounted.",
                "Renders a CSS class .agent-focused-element on active focus.",
            ]}
        />
    );
}

// ─── fancy-3d ──────────────────────────────────────────────────────────────

function Fancy3DCanvasDemo() {
    return (
        <Explainer
            summary={`Engine-pluggable 3D canvas. Set engine="dom" for a CSS-3D mode that has no Babylon dep, or engine="babylon" for a full WebGL scene. Same JSX inside.`}
            code={'import { Canvas, Stage, Card3D } from "@particle-academy/fancy-3d/dom";\n\n<Canvas engine="dom" style={{ height: 360 }}>\n  <Stage>\n    <Card3D position={[0, 0, 0]} rotation={[0, 30, 0]}>\n      <YourReactCard />   {/* any React node */}\n    </Card3D>\n  </Stage>\n</Canvas>'}
        />
    );
}

function Fancy3DStageDemo() {
    return (
        <Explainer
            summary="Scene root. Owns camera, lighting, and the JSON scene graph. Same shape whether you're rendering through the DOM or Babylon adapter."
            code={'import { Stage } from "@particle-academy/fancy-3d";\n\n<Stage camera={{ position: [0, 2, 5], target: [0, 0, 0] }}>\n  {/* primitives + Card3D / Monitor / Screen go here */}\n</Stage>'}
        />
    );
}

function Fancy3DMonitorDemo() {
    return (
        <Explainer
            summary="A 3D plane that renders a DOM (HTML/React) surface as a texture. Lets you put a working react-fancy <Card> or <Table> on a monitor in the scene."
            code={'import { Monitor } from "@particle-academy/fancy-3d/babylon";\nimport { Card } from "@particle-academy/react-fancy";\n\n<Monitor width={2} height={1.2} position={[0, 1, 0]}>\n  <Card>\n    <Card.Body>Renders as a live texture in WebGL.</Card.Body>\n  </Card>\n</Monitor>'}
        />
    );
}

function Fancy3DCard3DDemo() {
    return (
        <Explainer
            summary="3D-native card primitive. Like react-fancy <Card> but positioned + rotated in scene space. Children are regular React nodes."
            code={'import { Card3D } from "@particle-academy/fancy-3d";\n\n<Card3D position={[0, 0, 0]} rotation={[0, 30, 0]} size={[2, 1.2]}>\n  <h3>Hello from 3D</h3>\n  <p>Children are normal React.</p>\n</Card3D>'}
        />
    );
}

// ─── agent-integrations ────────────────────────────────────────────────────

function MicroMcpServerDemo() {
    return (
        <Explainer
            summary="The Human+ UX core: a tiny MCP server that runs inside the browser tab. Bridges register typed tools against it; transports (in-process, SSE-relay) let local and remote agents call them."
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
        <Explainer
            summary="Per-agent control panel. Lists active agents, their last activity, presence color, and exposes pause/resume/dismiss controls."
            code={'import { AgentPanel } from "@particle-academy/agent-integrations";\n\n<AgentPanel agents={[{ id: "claude", name: "Claude", color: "#a855f7" }]} />'}
        />
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
            summary="One-line composite: renders fancy-whiteboard's Board, mounts the MCP server, registers the whiteboard bridge, and wires the SSE share relay. Copy the share URL, paste into Claude Code, and the agent joins live."
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
                        <Action size="sm" color="red" variant="ghost" onClick={() => setSharing(false)}>Stop</Action>
                    ) : (
                        <Action size="sm" color="violet" onClick={() => setSharing(true)}>Start sharing</Action>
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
    return (
        <Explainer
            summary="App-shell provider for Inertia apps using Fancy UI. Mounts Toast.Provider, fancy-screens' ScreenSystem, and registers echarts modules — all above the Inertia outlet so providers survive page swaps."
            code={'import { createInertiaApp } from "@inertiajs/react";\nimport { createRoot } from "react-dom/client";\nimport { FancyAppRoot } from "@particle-academy/fancy-inertia";\n\ncreateInertiaApp({\n  resolve: (name) => import(`./Pages/${name}.tsx`),\n  setup({ App, props, el }) {\n    createRoot(el).render(\n      <FancyAppRoot>\n        <App {...props} />\n      </FancyAppRoot>,\n    );\n  },\n});'}
            bullets={[
                "withScreens={false} skips fancy-screens registration (saves a context layer if you don't use it).",
                "withECharts={false} disables echarts module auto-registration for tree-shaking control.",
                "toastPosition prop changes where toasts dock.",
            ]}
        />
    );
}

function ContentRendererDemo() {
    return (
        <Explainer
            summary="Renders structured content (markdown-ish blocks: headings, paragraphs, code, lists, images, tables) from a JSON document. Extensions register custom block types and inline marks."
            code={'import { ContentRenderer, registerExtension } from "@particle-academy/react-fancy";\n\nconst doc = {\n  type: "doc",\n  content: [\n    { type: "heading", level: 2, text: "Hello" },\n    { type: "paragraph", content: [{ type: "text", text: "Body text with a " }, { type: "text", marks: ["bold"], text: "bold" }, { type: "text", text: " span." }] },\n    { type: "code_block", lang: "ts", text: "const greet = (n) => \'hi \' + n;" },\n  ],\n};\n\n<ContentRenderer document={doc} />'}
            bullets={[
                "Document shape is plain JSON — easy for agents to author.",
                "Extensions plug in via registerExtension({ type, render }).",
                "Pairs with <Editor> — same document shape, round-trip safe.",
            ]}
        />
    );
}

function EditorDemo() {
    const [v, setV] = useState({
        type: "doc",
        content: [
            { type: "paragraph", content: [{ type: "text", text: "Type here. Try bold, italic, lists." }] },
        ],
    });
    return (
        <Explainer
            summary="Rich-text editor producing the same JSON document shape ContentRenderer reads. Toolbar slot is composable; built-in commands cover bold/italic/headings/lists/code blocks."
            code={'import { Editor } from "@particle-academy/react-fancy";\n\nconst [doc, setDoc] = useState(EMPTY_DOC);\n\n<Editor\n  value={doc}\n  onChange={setDoc}\n  toolbar={[\n    { command: "bold",      label: "B" },\n    { command: "italic",    label: "I" },\n    { command: "heading",   commandArg: "2", label: "H2" },\n    { command: "bulletList",label: "•" },\n    { command: "codeBlock", label: "</>" },\n  ]}\n/>'}
            bullets={[
                "Editor.value is the same JSON shape ContentRenderer accepts.",
                "Toolbar is data-driven; you can add custom commands.",
                "Use with useFancyForm() and useEditor() for richer integrations.",
            ]}
        />
    );
}

function UseFancyFormDemo() {
    return (
        <Explainer
            summary="Inertia useForm() wrapper with a .field(name) helper that drops directly into react-fancy <Input> / <Select> / <Switch>. No more rewiring value + onChange + error props by hand."
            code={'import { useFancyForm } from "@particle-academy/fancy-inertia";\n\nconst form = useFancyForm({ url: "", title: "", description: "" });\n\n<form onSubmit={(e) => { e.preventDefault(); form.post("/submit"); }}>\n  <Input  {...form.field("url")}         label="URL" />\n  <Input  {...form.field("title")}       label="Title (optional)" />\n  <Textarea {...form.field("description")} label="Description" />\n\n  <Action type="submit" disabled={form.processing}>Submit</Action>\n</form>'}
        />
    );
}
