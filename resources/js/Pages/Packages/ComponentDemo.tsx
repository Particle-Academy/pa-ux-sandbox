import { useState } from "react";
import {
    Accordion,
    Action,
    Autocomplete,
    Avatar,
    Badge,
    Brand,
    Breadcrumbs,
    Callout,
    Card,
    Heading,
    Pagination,
    Pillbox,
    Popover,
    Progress,
    Separator,
    Skeleton,
    Tabs,
    Text,
    Timeline,
    Tooltip,
    useToast,
} from "@particle-academy/react-fancy";

type DemoFn = () => JSX.Element;

const REGISTRY: Record<string, DemoFn> = {
    "react-fancy/action": ActionDemo,
    "react-fancy/badge": BadgeDemo,
    "react-fancy/card": CardDemo,
    "react-fancy/heading": HeadingDemo,
    "react-fancy/text": TextDemo,
    "react-fancy/separator": SeparatorDemo,
    "react-fancy/avatar": AvatarDemo,
    "react-fancy/brand": BrandDemo,
    "react-fancy/skeleton": SkeletonDemo,
    "react-fancy/progress": ProgressDemo,
    "react-fancy/breadcrumbs": BreadcrumbsDemo,
    "react-fancy/tabs": TabsDemo,
    "react-fancy/accordion": AccordionDemo,
    "react-fancy/callout": CalloutDemo,
    "react-fancy/timeline": TimelineDemo,
    "react-fancy/pagination": PaginationDemo,
    "react-fancy/tooltip": TooltipDemo,
    "react-fancy/popover": PopoverDemo,
    "react-fancy/pillbox": PillboxDemo,
    "react-fancy/autocomplete": AutocompleteDemo,
    "react-fancy/toast": ToastDemo,
};

export function ComponentDemo({ slug, name, pkg }: { slug: string; name: string; pkg: string }) {
    const Demo = REGISTRY[`${pkg}/${slug}`];
    if (Demo) return <Demo />;
    return (
        <div className="grid place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-10 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
            Interactive demo for <code className="ml-1 font-mono">{name}</code> isn't wired in the registry yet.
            See the import snippet below.
        </div>
    );
}

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
