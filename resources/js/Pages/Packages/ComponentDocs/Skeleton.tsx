import type { ComponentDoc } from "./types";
import { Card, Skeleton } from "@particle-academy/react-fancy";

export const skeletonDoc: ComponentDoc = {
    intro: (
        <p>
            Pulsing placeholder for loading states. Three shapes (<code>rect</code>,
            <code>circle</code>, <code>text</code>) cover most needs — compose them to mimic the
            real layout while data fetches. The animation respects <code>prefers-reduced-motion</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A bare Skeleton is a thin rectangle — useful inside a sized container.",
            render: () => (
                <div className="w-full max-w-sm space-y-2">
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                </div>
            ),
            code: `<Skeleton />
<Skeleton />
<Skeleton />`,
        },
        {
            name: "Shapes",
            description: "rect for cards/blocks, circle for avatars, text for paragraph lines.",
            render: () => (
                <div className="flex w-full items-center gap-4">
                    <Skeleton shape="rect" width={80} height={48} />
                    <Skeleton shape="circle" width={48} height={48} />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton shape="text" />
                        <Skeleton shape="text" width="80%" />
                    </div>
                </div>
            ),
            code: `<Skeleton shape="rect" width={80} height={48} />
<Skeleton shape="circle" width={48} height={48} />
<Skeleton shape="text" />
<Skeleton shape="text" width="80%" />`,
        },
        {
            name: "Custom dimensions",
            description: "Width and height accept numbers (px) or strings (any CSS value).",
            render: () => (
                <div className="flex w-full items-end gap-2">
                    <Skeleton width={40} height={40} />
                    <Skeleton width={80} height={80} />
                    <Skeleton width="120px" height="120px" />
                    <Skeleton width="100%" height={80} />
                </div>
            ),
            code: `<Skeleton width={40} height={40} />
<Skeleton width={80} height={80} />
<Skeleton width="120px" height="120px" />
<Skeleton width="100%" height={80} />`,
        },
        {
            name: "Card placeholder",
            description: "Compose shapes to mirror the actual layout — users notice less when the page hydrates.",
            render: () => (
                <Card className="w-full max-w-sm" padding="md">
                    <div className="flex items-center gap-3">
                        <Skeleton shape="circle" width={44} height={44} />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton shape="text" width="60%" />
                            <Skeleton shape="text" width="40%" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                        <Skeleton shape="text" />
                        <Skeleton shape="text" />
                        <Skeleton shape="text" width="80%" />
                    </div>
                </Card>
            ),
            code: `<Card padding="md">
    <div className="flex items-center gap-3">
        <Skeleton shape="circle" width={44} height={44} />
        <div className="flex-1 space-y-1.5">
            <Skeleton shape="text" width="60%" />
            <Skeleton shape="text" width="40%" />
        </div>
    </div>
    <div className="mt-4 space-y-1.5">
        <Skeleton shape="text" />
        <Skeleton shape="text" />
        <Skeleton shape="text" width="80%" />
    </div>
</Card>`,
        },
    ],
    props: [
        { name: "shape", type: `"rect" | "circle" | "text"`, default: `"rect"`, description: "Placeholder shape." },
        { name: "width", type: `string | number`, default: `"100%"`, description: "Numbers become px. Any CSS value (`\"60%\"`, `\"10rem\"`) is also accepted." },
        { name: "height", type: `string | number`, default: "shape-dependent", description: "Numbers become px. Any CSS value also accepted." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the wrapping div." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Accessibility:</strong> the animation pauses for users with
            <code>prefers-reduced-motion</code>. Always pair a skeleton tree with
            <code>aria-busy</code> on the container so screen readers know to wait.
        </p>
    ),
};
