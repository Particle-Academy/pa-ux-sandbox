import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type UIEvent } from "react";
import { sampleTimeline, toCss, type NodeState, type TimelineDoc } from "@particle-academy/fancy-motion";
import { Reveal, TimelineDock } from "@particle-academy/fancy-motion/react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Container,
    Eyebrow,
    Grid,
    Heading,
    Icon,
    Progress,
    Section,
    Text,
} from "@particle-academy/react-fancy";

/**
 * The two fancy-motion component pages' Preview panels.
 *
 * MotionStage's preview used to be MotionStage itself: one card on a
 * `frames x 100vh` spacer, played by WINDOW scroll. The spacer is the only way
 * the installed MotionStage makes scroll distance, so the panel was a tall,
 * nearly empty column you had to scroll the whole page through. MotionStage
 * reads `window` scroll and sizes its pin to `100vh`, with no prop for a scroll
 * root or an external progress, so it cannot be contained in a box. What CAN be
 * contained is the rest of the package: `Reveal` (whose IntersectionObserver is
 * clipped by the scroll box, so a section reveals when it scrolls into the
 * box's view) and the pure engine MotionStage runs on (`sampleTimeline` +
 * `toCss`), fed here by the box's own scroll progress.
 *
 * TimelineDock's preview had no `onScrub`, so its Play button was disabled and
 * nothing moved. The dock is controlled: its `progress` and `onScrub` are the
 * playhead, and the stage beside it is sampled from the same timeline at the
 * same progress.
 */

/** The attribute the animated nodes carry, matching ComponentPreviews' MOTION_NODE_ATTR. */
const NODE_ATTR = "data-motion";

/** True when the OS asked for less motion. Read on mount; SSR never renders these demos. */
function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(query.matches);
        const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
        query.addEventListener?.("change", onChange);
        return () => query.removeEventListener?.("change", onChange);
    }, []);
    return reduced;
}

/** A node's inline style at one sampled state, or nothing under reduced motion. */
function nodeStyle(state: NodeState | undefined, reduced: boolean): CSSProperties | undefined {
    if (reduced || !state) return undefined;
    const css = toCss(state);
    return { transform: css.transform, opacity: css.opacity };
}

/**
 * How a revealed block arrives. Reveal only flips `data-in-view`; the look is
 * ours. Hidden ONLY while out of view and only when motion is allowed, so
 * reduced motion (which Reveal starts revealed anyway) never hides anything.
 */
const REVEAL_CLASS =
    "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-safe:data-[in-view=false]:translate-y-6 motion-safe:data-[in-view=false]:opacity-0";

function Rise({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
    return (
        <Reveal amount={0.2} className={`${REVEAL_CLASS} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
            {children}
        </Reveal>
    );
}

// ── MotionStage: the microsite ───────────────────────────────────────────

/**
 * The microsite's scroll timeline: the brand mark in its sticky header turns a
 * full revolution over the page, and the hero's glow drifts and fades as the
 * hero leaves. Snapshots name the nodes they move; an empty one tweens nothing.
 */
export const SITE_TIMELINE: TimelineDoc = {
    id: "fernhill-site",
    axis: "vertical",
    frames: 4,
    keyframes: [
        { id: "top", at: 0, mode: "snap", snapshot: { mark: { rotate: 0, scale: 1 }, glow: { x: 0, y: 0, scale: 1, opacity: 1 } } },
        { id: "mid", at: 0.5, mode: "scroll", ease: "ease-in-out", snapshot: { mark: { rotate: 180, scale: 1.2 }, glow: { x: 60, y: 140, scale: 1.4, opacity: 0.35 } } },
        { id: "end", at: 1, mode: "scroll", ease: "ease-out", snapshot: { mark: { rotate: 360, scale: 1 }, glow: { x: 120, y: 260, scale: 1.8, opacity: 0 } } },
    ],
};

const ROASTS = [
    { name: "Morning Tide", origin: "Huila, Colombia", notes: "Red apple, cane sugar, cocoa", badge: "House" },
    { name: "Blackthorn", origin: "Sidama, Ethiopia", notes: "Blueberry, jasmine, dark honey", badge: "Seasonal" },
    { name: "Long Field", origin: "Minas Gerais, Brazil", notes: "Hazelnut, milk chocolate, toffee", badge: "Espresso" },
];

const STEPS = [
    { icon: "calendar", title: "Pick a rhythm", body: "Every week, fortnight or month. Skip or pause from one link." },
    { icon: "flame", title: "Roasted Tuesday", body: "Small batches, roasted the day before they leave the dock." },
    { icon: "package", title: "At your door Thursday", body: "Recyclable bags, letterbox-sized, tracked end to end." },
];

const STATS = [
    { value: "11", label: "partner farms, bought from every year" },
    { value: "2 days", label: "from roaster to letterbox" },
    { value: "4,200", label: "subscribers, and counting" },
];

/** The microsite's sections, in page order, for the panel's jump links. */
const SECTIONS = [
    { id: "hero", label: "Hero" },
    { id: "how", label: "How it works" },
    { id: "roasts", label: "Roasts" },
    { id: "proof", label: "Subscribers" },
    { id: "cta", label: "Free bag" },
];

function Mark({ style }: { style?: CSSProperties }) {
    return (
        <span
            {...{ [NODE_ATTR]: "mark" }}
            style={style}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white will-change-transform dark:bg-emerald-500 dark:text-zinc-950"
        >
            <Icon name="coffee" size="xs" />
        </span>
    );
}

export function MotionMicrositeDemo() {
    const reduced = useReducedMotion();
    const [progress, setProgress] = useState(0);
    const snap = useMemo(() => sampleTimeline(SITE_TIMELINE, progress), [progress]);

    const onScroll = (event: UIEvent<HTMLDivElement>) => {
        const el = event.currentTarget;
        const len = el.scrollHeight - el.clientHeight;
        setProgress(len > 0 ? Math.min(1, Math.max(0, el.scrollTop / len)) : 0);
    };

    const markState = snap.mark ?? {};
    const scrollerRef = useRef<HTMLDivElement>(null);

    /** Scroll the BOX (never the page) to a section, under its sticky header. */
    const jumpTo = (id: string) => {
        const box = scrollerRef.current;
        const section = box?.querySelector<HTMLElement>(`[data-motion-site-section='${id}']`);
        if (!box || !section) return;
        const header = box.querySelector<HTMLElement>("[data-motion-site-header]")?.offsetHeight ?? 0;
        box.scrollTo({ top: Math.max(0, section.offsetTop - header), behavior: reduced ? "auto" : "smooth" });
    };

    return (
        <div data-motion-site="" data-progress={progress.toFixed(2)} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
            {/* The microsite, in a browser-ish frame. */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                    <span aria-hidden className="flex gap-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    </span>
                    <Text as="span" size="xs" color="muted" className="truncate font-mono">
                        fernhill.example.com
                    </Text>
                </div>

                <div
                    ref={scrollerRef}
                    data-motion-site-scroller=""
                    onScroll={onScroll}
                    tabIndex={0}
                    aria-label="Fernhill Coffee microsite preview. Scroll inside it."
                    className="relative h-[26rem] overflow-y-auto overscroll-contain focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    {/* Sticky site header, with the scroll-linked mark and progress. */}
                    <div data-motion-site-header="" className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
                        <Container size="full" className="flex items-center gap-2.5 px-5 py-2.5">
                            <Mark style={nodeStyle(markState, reduced)} />
                            <Text as="span" size="sm" weight="semibold">
                                Fernhill Coffee
                            </Text>
                            <span className="flex-1" />
                            <Button size="xs" variant="ghost" className="hidden sm:inline-flex">
                                Roasts
                            </Button>
                            <Button size="xs" color="emerald">
                                Subscribe
                            </Button>
                        </Container>
                        <Progress value={Math.round(progress * 100)} size="sm" color="emerald" className="rounded-none" aria-label="Scroll progress" />
                    </div>

                    {/* Sections render as <div>: the showcase's global `section`
                        rule (landing.css) pads every <section> 96px and would
                        beat Section's own spacing. */}

                    {/* Hero */}
                    <Section as="div" space="sm" data-motion-site-section="hero" className="relative overflow-hidden">
                        <span
                            aria-hidden
                            {...{ [NODE_ATTR]: "glow" }}
                            style={nodeStyle(snap.glow, reduced)}
                            className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-500/20"
                        />
                        <Container size="full" className="relative px-5">
                            <Rise>
                                <Eyebrow label="Small-batch roaster · est. 2019" />
                                <Heading as="h1" size="2xl" weight="bold" className="mt-2 max-w-lg tracking-tight">
                                    Coffee roasted on Tuesday, in your cup by Thursday.
                                </Heading>
                                <Text color="muted" className="mt-3 max-w-lg">
                                    Three seasonal roasts from farms we buy from every year, delivered on the rhythm you choose.
                                </Text>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <Button color="emerald" iconTrailing="arrow-right">
                                        Start a subscription
                                    </Button>
                                    <Button variant="ghost">See this week's roasts</Button>
                                </div>
                            </Rise>
                        </Container>
                    </Section>

                    {/* How it works */}
                    <Section as="div" space="sm" divider data-motion-site-section="how">
                        <Container size="full" className="px-5">
                            <Rise>
                                <Heading as="h2" size="lg" weight="semibold">
                                    How it works
                                </Heading>
                            </Rise>
                            <Grid cols={3} gap="sm" className="mt-4">
                                {STEPS.map((step, i) => (
                                    <Rise key={step.title} delay={i * 120}>
                                        <Card variant="muted" size="sm" className="h-full">
                                            <Card.Body>
                                                <Icon name={step.icon} className="text-emerald-700 dark:text-emerald-400" />
                                                <Text weight="semibold" className="mt-2">
                                                    {step.title}
                                                </Text>
                                                <Text size="sm" color="muted" className="mt-1">
                                                    {step.body}
                                                </Text>
                                            </Card.Body>
                                        </Card>
                                    </Rise>
                                ))}
                            </Grid>
                        </Container>
                    </Section>

                    {/* Roasts */}
                    <Section as="div" space="sm" divider data-motion-site-section="roasts">
                        <Container size="full" className="px-5">
                            <Rise>
                                <Heading as="h2" size="lg" weight="semibold">
                                    This month's roasts
                                </Heading>
                            </Rise>
                            <Grid cols={3} gap="sm" className="mt-4">
                                {ROASTS.map((roast, i) => (
                                    <Rise key={roast.name} delay={i * 120}>
                                        <Card size="sm" className="h-full">
                                            <Card.Body>
                                                <div className="flex items-start justify-between gap-2">
                                                    <Text weight="semibold">{roast.name}</Text>
                                                    <Badge size="sm" color="emerald" variant="soft">
                                                        {roast.badge}
                                                    </Badge>
                                                </div>
                                                <Text size="xs" color="muted" className="mt-0.5">
                                                    {roast.origin}
                                                </Text>
                                                <Text size="sm" className="mt-2">
                                                    {roast.notes}
                                                </Text>
                                            </Card.Body>
                                        </Card>
                                    </Rise>
                                ))}
                            </Grid>
                        </Container>
                    </Section>

                    {/* Numbers + a voice */}
                    <Section as="div" space="sm" divider data-motion-site-section="proof">
                        <Container size="full" className="px-5">
                            <Grid cols={3} gap="sm">
                                {STATS.map((stat, i) => (
                                    <Rise key={stat.label} delay={i * 120}>
                                        <Heading as="h3" size="2xl" weight="bold" className="tabular-nums text-emerald-700 dark:text-emerald-400">
                                            {stat.value}
                                        </Heading>
                                        <Text size="sm" color="muted">
                                            {stat.label}
                                        </Text>
                                    </Rise>
                                ))}
                            </Grid>
                            <Rise delay={120} className="mt-5">
                                <Card variant="soft" size="sm">
                                    <Card.Body>
                                        <Text className="italic">
                                            "The only subscription I've never paused. The Blackthorn tastes like it was roasted this morning."
                                        </Text>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Avatar size="sm" fallback="MR" />
                                            <Text size="sm" color="muted">
                                                Maya R., subscriber since 2021
                                            </Text>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Rise>
                        </Container>
                    </Section>

                    {/* Footer CTA */}
                    <Section as="div" space="sm" data-motion-site-section="cta" className="bg-emerald-50 dark:bg-emerald-500/10">
                        <Container size="full" className="px-5 text-center">
                            <Rise>
                                <Heading as="h2" size="xl" weight="bold">
                                    Your first bag is on us.
                                </Heading>
                                <Text color="muted" className="mt-2">
                                    Pick a roast, pick a rhythm, cancel any time.
                                </Text>
                                <Button color="emerald" className="mt-4" iconTrailing="arrow-right">
                                    Claim the free bag
                                </Button>
                                <Text size="xs" color="muted" className="mt-6">
                                    Fernhill Coffee · hello@example.com
                                </Text>
                            </Rise>
                        </Container>
                    </Section>
                </div>
            </div>

            {/* What the engine is doing, live. */}
            <Card size="sm" className="h-full">
                <Card.Body className="space-y-3">
                    <div>
                        <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wide">
                            Playhead
                        </Text>
                        <div className="mt-1 flex items-baseline gap-2">
                            <Heading as="h3" size="2xl" weight="bold" className="tabular-nums">
                                {Math.round(progress * 100)}%
                            </Heading>
                            <Text size="xs" color="muted">
                                of the box's scroll
                            </Text>
                        </div>
                        <Progress value={Math.round(progress * 100)} size="sm" color="emerald" className="mt-2" aria-label="Playhead" />
                    </div>
                    <div>
                        <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wide">
                            sampleTimeline → mark
                        </Text>
                        <Text size="sm" className="mt-1 font-mono tabular-nums">
                            rotate {Math.round(markState.rotate ?? 0)}° · scale {(markState.scale ?? 1).toFixed(2)}
                        </Text>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {SITE_TIMELINE.keyframes.map((k) => (
                            <Badge key={k.id} size="sm" variant={progress >= k.at ? "solid" : "outline"} color="emerald">
                                {k.id} @ {Math.round(k.at * 100)}%
                            </Badge>
                        ))}
                    </div>
                    <div>
                        <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wide">
                            Jump to
                        </Text>
                        <div className="mt-1 flex flex-wrap gap-1 lg:flex-col lg:items-start">
                            {SECTIONS.map((section) => (
                                <Button key={section.id} size="xs" variant="ghost" icon="arrow-down-right" onClick={() => jumpTo(section.id)}>
                                    {section.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Text size="xs" color="muted">
                        {reduced
                            ? "Reduced motion is on: every section is shown and nothing moves."
                            : "Scroll inside the site. Each section reveals as it enters the box."}
                    </Text>
                </Card.Body>
            </Card>
        </div>
    );
}

// ── TimelineDock: the dock drives a stage ────────────────────────────────

/** A mini hero that assembles itself: badge drops in, headline slides, CTA pops. */
export const DOCK_TIMELINE: TimelineDoc = {
    id: "dock-hero",
    axis: "vertical",
    frames: 2,
    keyframes: [
        {
            id: "k1",
            at: 0,
            mode: "snap",
            snapshot: {
                badge: { y: -40, rotate: -12, opacity: 0 },
                headline: { x: -120, opacity: 0 },
                cta: { scale: 0.4, opacity: 0 },
            },
        },
        {
            id: "k2",
            at: 0.5,
            mode: "scroll",
            ease: "ease-out",
            snapshot: {
                badge: { y: 0, rotate: 0, opacity: 1 },
                headline: { x: 0, opacity: 1 },
                cta: { scale: 0.4, opacity: 0 },
            },
        },
        {
            id: "k3",
            at: 1,
            mode: "scroll",
            ease: "ease-in-out",
            snapshot: {
                badge: { y: 0, rotate: 0, opacity: 1 },
                headline: { x: 0, opacity: 1 },
                cta: { scale: 1, opacity: 1 },
            },
        },
    ],
};

export function MotionDockDemo() {
    const [timeline, setTimeline] = useState<TimelineDoc>(DOCK_TIMELINE);
    const [progress, setProgress] = useState(0.6);
    const [selected, setSelected] = useState<string | null>(null);
    const snap = useMemo(() => sampleTimeline(timeline, progress), [timeline, progress]);

    const selectKeyframe = (id: string | null) => {
        setSelected(id);
        const keyframe = id ? timeline.keyframes.find((k) => k.id === id) : undefined;
        if (keyframe) setProgress(keyframe.at);
    };

    // Scrubbing and Play are the viewer's own action, so the stage follows them
    // even under reduced motion: nothing here moves unless asked to.
    const style = (id: string) => nodeStyle(snap[id], false);

    return (
        <div data-timeline-dock-demo="" className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div
                data-dock-stage=""
                data-progress={progress.toFixed(2)}
                className="relative h-48 overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-zinc-800 dark:from-emerald-500/10 dark:to-zinc-950"
            >
                <span {...{ [NODE_ATTR]: "badge" }} style={style("badge")} className="inline-block">
                    <Badge size="sm" color="emerald" variant="soft">
                        New roast
                    </Badge>
                </span>
                <div {...{ [NODE_ATTR]: "headline" }} style={style("headline")} className="mt-3">
                    <Heading as="h3" size="xl" weight="bold" className="tracking-tight">
                        Blackthorn is back.
                    </Heading>
                    <Text size="sm" color="muted" className="mt-1">
                        Blueberry, jasmine, dark honey.
                    </Text>
                </div>
                <div {...{ [NODE_ATTR]: "cta" }} style={style("cta")} className="mt-4 inline-block origin-left">
                    <Button size="sm" color="emerald" iconTrailing="arrow-right">
                        Add to my box
                    </Button>
                </div>
            </div>

            <div className="min-w-0 space-y-2">
                <div className="overflow-x-auto">
                    <TimelineDock
                        value={timeline}
                        onChange={setTimeline}
                        progress={progress}
                        onScrub={setProgress}
                        selectedKeyframe={selected}
                        onSelectKeyframe={selectKeyframe}
                        previewDurationMs={2400}
                    />
                </div>
                <Text size="xs" color="muted" className="tabular-nums">
                    Playhead {Math.round(progress * 100)}%. Press Play, drag the track, or click a keyframe: the stage is sampled
                    from the same timeline at the same progress.
                </Text>
            </div>
        </div>
    );
}
