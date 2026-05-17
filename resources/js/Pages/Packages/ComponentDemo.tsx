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
            options={["Glenn Wagner", "Rita Kumar", "Sam Lin", "Ayodeji Adekola", "Priya Patel"]}
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
            <MobileMenu open={open} onClose={() => setOpen(false)}>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Inbox</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Projects</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Team</MobileMenu.Item>
                <MobileMenu.Item href="#" onClick={() => setOpen(false)}>Settings</MobileMenu.Item>
            </MobileMenu>
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
                            { id: "summarize", label: "Summarize thread" },
                            { id: "tldr", label: "TL;DR" },
                            { id: "actions", label: "Pull action items" },
                        ],
                        renderItem: (i: any) => i.label,
                        toReplacement: (i: any) => "/" + i.id + " ",
                    },
                    "@": {
                        items: [
                            { id: "glenn", label: "Glenn Wagner" },
                            { id: "rita", label: "Rita Kumar" },
                            { id: "sam", label: "Sam Lin" },
                        ],
                        renderItem: (i: any) => i.label,
                        toReplacement: (i: any) => "@" + i.id + " ",
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
                { id: "shorten", label: "Shorten", run: (sel) => sel.text.split(/\s+/).slice(0, Math.ceil(sel.text.split(/\s+/).length / 2)).join(" ") },
                { id: "upper", label: "Uppercase", run: (sel) => sel.text.toUpperCase() },
            ]}
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
        <Table
            columns={[
                { key: "name", label: "Customer", sortable: true },
                { key: "mrr", label: "MRR", sortable: true, render: (v) => `$${(v as number).toLocaleString()}` },
                { key: "seats", label: "Seats", sortable: true },
            ]}
            data={rows}
        />
    );
}

function CarouselDemo() {
    return (
        <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Carousel variant="directional" loop>
                <Carousel.Slides>
                    {[
                        { tone: "from-violet-400 to-sky-400", title: "Authorable" },
                        { tone: "from-emerald-400 to-sky-400", title: "Inhabitable" },
                        { tone: "from-amber-400 to-rose-400", title: "Composable" },
                    ].map((s, i) => (
                        <Carousel.Slide key={i}>
                            <div className={`grid h-40 place-items-center bg-gradient-to-br ${s.tone}`}>
                                <span className="text-2xl font-semibold text-white">{s.title}</span>
                            </div>
                        </Carousel.Slide>
                    ))}
                </Carousel.Slides>
                <Carousel.Controls />
                <Carousel.Indicators />
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
