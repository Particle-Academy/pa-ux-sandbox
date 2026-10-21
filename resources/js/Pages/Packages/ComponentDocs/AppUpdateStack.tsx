import { useState } from "react";
import { Button, Text, useToast } from "@particle-academy/react-fancy";
import { AppUpdateStack, type AppUpdateFeature } from "@particle-academy/fancy-inertia/stack";
import type { ComponentDoc } from "./types";

/**
 * fancy-inertia's AppUpdateStack, rendered INLINE so it is visible without a
 * real deploy. Detection is simulated with `check={() => true}`: the core hook
 * checks on an interval (never on mount), so a short `interval` stands in for
 * "a new build landed". In an app you pass neither -- the Inertia version ping
 * is the default.
 */

/** A release with a message: the cards that stack behind the refresh action. */
export const RELEASE_FEATURES: AppUpdateFeature[] = [
    {
        id: "sheets",
        title: "Spreadsheets, in the page",
        description: "Multi-sheet workbooks with formulas, editable by people and agents.",
        image: "/showcase-shots/fancy-sheets.png",
        // Shown instead of `image` in dark mode (fancy-app-update 0.4.0+).
        imageDark: "/showcase-shots/fancy-sheets-dark.png",
        imageAlt: "A fancy-sheets workbook",
    },
    {
        id: "charts",
        title: "Charts that follow your theme",
        description: "ECharts picks up the active palette in light and dark.",
        image: "/showcase-shots/fancy-echarts.png",
        imageAlt: "A fancy-echarts dashboard",
    },
    { id: "search", title: "Faster search", description: "Results as you type, across every page." },
    // A fourth card, so the stack has more than its default depth of 2 behind
    // the front one and shows the "+N" count badge.
    { id: "export", title: "Exports to PDF", description: "Any page, one click, print-ready." },
];

/** A simulated deploy: detected on the first tick, every time it is remounted. */
const SIMULATED = { check: () => true, interval: 400, pollOnFocus: false } as const;

export function AppUpdateStackExample({ features }: { features?: AppUpdateFeature[] }) {
    const { toast } = useToast();
    const [run, setRun] = useState(0);

    return (
        <div className="w-full max-w-sm space-y-3" data-demo="app-update-stack">
            <AppUpdateStack
                key={run}
                {...SIMULATED}
                features={features}
                position="inline"
                onRefresh={() =>
                    toast({
                        title: "Refresh",
                        description: "A real app reloads here to pick up the new build.",
                        variant: "success",
                    })
                }
            />
            <Button size="sm" variant="ghost" icon="refresh-cw" onClick={() => setRun((n) => n + 1)}>
                Simulate another deploy
            </Button>
        </div>
    );
}

/** The Preview tab: the hotfix notice beside a release with feature cards. */
export function AppUpdateStackDemo() {
    return (
        <div className="space-y-4">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Both notices are shown inline with a simulated deploy. In your app, mount one with{" "}
                <code>setupFancyApp</code>; it stays hidden until Inertia reports a new build.
            </Text>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wide !text-zinc-500">
                        Hotfix, no message
                    </Text>
                    <AppUpdateStackExample />
                </div>
                <div className="space-y-2">
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wide !text-zinc-500">
                        Release with feature cards
                    </Text>
                    <AppUpdateStackExample features={RELEASE_FEATURES} />
                </div>
            </div>
        </div>
    );
}

export const appUpdateStackDoc: ComponentDoc = {
    intro: (
        <div className="space-y-2">
            <p>
                The &quot;a new version is available&quot; notice that can say what is new. When a
                release has a message, its feature cards stack behind each other (react-fancy&apos;s{" "}
                <code>Toast.Stack</code>; scroll or use the arrow keys), each with a close button and a{" "}
                <strong>Refresh to get the latest</strong> action. A hotfix with no message gets the
                plain notice.
            </p>
            <p>
                It is <code>fancy-app-update</code>&apos;s <code>AppUpdateStack</code> with
                fancy-inertia&apos;s Inertia version check as the default detector: Inertia answers{" "}
                <code>409</code> to a stale <code>X-Inertia-Version</code>, so there is no endpoint to
                add. Every core prop passes straight through.
            </p>
        </div>
    ),
    examples: [
        {
            name: "Hotfix: the plain refresh notice",
            description: "No `features`, so the notice is a single card with the refresh action.",
            render: () => <AppUpdateStackExample />,
            code: `import { AppUpdateStack } from "@particle-academy/fancy-inertia/stack";

<AppUpdateStack />`,
        },
        {
            name: "Release: feature cards with images",
            description:
                "Each card can carry an image, shown full width as its header, and an `imageDark` shown instead in dark mode (the `.dark` class, CSS-only). Pass the cards, or a loader that runs once, when the update is detected.",
            render: () => <AppUpdateStackExample features={RELEASE_FEATURES} />,
            code: `import { AppUpdateStack } from "@particle-academy/fancy-inertia/stack";

<AppUpdateStack
    features={[
        {
            title: "Spreadsheets, in the page",
            description: "Multi-sheet workbooks with formulas.",
            image: "/whats-new/sheets.png",
            imageDark: "/whats-new/sheets-dark.png", // shown in dark mode
            imageAlt: "A workbook",
        },
        { title: "Faster search" },
    ]}
/>

// or fetch the new build's notes when the update lands:
<AppUpdateStack features={() => fetch("/whats-new").then((r) => r.json())} />`,
        },
        {
            name: "Mount it once, from setupFancyApp",
            description:
                "Pass the element as `appUpdate`. It mounts inside Inertia's <App>, so it survives navigation. `appUpdate: true` still mounts the plain AppUpdateAlert.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    The package root never imports the stack, so apps that do not use it never load it.
                </Text>
            ),
            code: `import { createInertiaApp } from "@inertiajs/react";
import { setupFancyApp } from "@particle-academy/fancy-inertia";
import { AppUpdateStack } from "@particle-academy/fancy-inertia/stack";

createInertiaApp({
    resolve,
    setup: ({ el, App, props }) =>
        setupFancyApp({
            el, App, props,
            appUpdate: <AppUpdateStack features={() => fetch("/whats-new").then((r) => r.json())} />,
        }),
});`,
        },
        {
            name: "The Inertia check, for any core component",
            description: "useInertiaVersionCheck() returns the detector as a `check`.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Resolves true on a 409, false otherwise, including on a network error.
                </Text>
            ),
            code: `import { useInertiaVersionCheck } from "@particle-academy/fancy-inertia";
import { AppUpdateAlert } from "@particle-academy/fancy-app-update";

function Prompt() {
    const check = useInertiaVersionCheck();
    return <AppUpdateAlert check={check} />;
}`,
        },
    ],
    props: [
        { name: "features", type: "AppUpdateFeature[] | () => Promise<AppUpdateFeature[]>", default: "—", description: "The release's cards, or a loader called once, when an update is detected." },
        { name: "title", type: "ReactNode", default: '"Update available"', description: "The plain notice's heading." },
        { name: "description", type: "ReactNode", default: '"A new version is ready."', description: "The plain notice's body." },
        { name: "refreshLabel", type: "ReactNode", default: '"Refresh to get the latest"', description: "The refresh button." },
        { name: "closeLabel", type: "string", default: '"Close"', description: "The close button's accessible name." },
        { name: "color", type: "ButtonColor", default: '"violet"', description: "Colour of the refresh button." },
        { name: "position", type: "corner | top | bottom | inline", default: '"bottom-right"', description: "A screen position, or inline where it is placed." },
        { name: "depth", type: "number", default: "2", description: "How many cards show behind the front one." },
        { name: "onRefresh", type: "() => void", default: "hard reload", description: "Customize the refresh action." },
        { name: "onDismiss", type: "() => void", default: "—", description: "Called when the person closes the notice." },
        { name: "renderFeature", type: "(feature, state) => ReactNode", default: "—", description: "Replace a card's content; the close and refresh controls stay." },
        { name: "render", type: "({ features, refresh, dismiss }) => ReactNode", default: "—", description: "Replace the whole notice." },
        { name: "check", type: "() => boolean | Promise<boolean>", default: "Inertia 409", description: "Your own detector, replacing the Inertia default." },
        { name: "interval", type: "number", default: "60_000", description: "Poll cadence in ms." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Import from <code>@particle-academy/fancy-inertia/stack</code> (0.12.0+). Needs
            react-fancy 5.41.0 or later for <code>Toast.Stack</code>; on an older one it renders
            nothing and logs one error naming the version. Feature cards carry{" "}
            <code>data-react-fancy-toast-stack-card</code> and the root{" "}
            <code>data-fancy-app-update-stack</code>.
        </p>
    ),
};
