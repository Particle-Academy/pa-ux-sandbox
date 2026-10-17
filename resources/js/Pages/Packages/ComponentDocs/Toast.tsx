import { useState } from "react";
import type { ComponentDoc } from "./types";
import type { ToastPosition } from "@particle-academy/react-fancy";
import { Button, Toast, useToast } from "@particle-academy/react-fancy";

interface DemoRequest {
    id: string;
    title: string;
    detail: string;
}

const DEMO_REQUESTS: DemoRequest[] = [
    { id: "pg", title: "Add a Postgres", detail: "An agent wants Postgres 17 with pgvector." },
    { id: "site", title: "Add a site", detail: "Serve repos/px-ui-sandbox at web.fancy." },
    { id: "queue", title: "Start a process", detail: "php artisan queue:work" },
    { id: "redis", title: "Add Redis", detail: "Redis 7, shared across workspaces." },
    { id: "mail", title: "Add Mailpit", detail: "SMTP plus a web inbox." },
];

/** Allow and Deny resolve the front request; Later leaves it in the stack. */
function StackDemo() {
    const [requests, setRequests] = useState(DEMO_REQUESTS);
    const [front, setFront] = useState(0);
    const resolve = (id: string) => setRequests((all) => all.filter((r) => r.id !== id));

    if (requests.length === 0) {
        return (
            <Button size="sm" onClick={() => setRequests(DEMO_REQUESTS)}>
                All resolved. Bring them back
            </Button>
        );
    }

    return (
        <Toast.Stack
            items={requests}
            getKey={(r) => r.id}
            depth={2}
            offset={8}
            scaleStep={0.05}
            frontIndex={front}
            onFrontIndexChange={setFront}
            position="inline"
            label="Approval requests"
            cardClassName="w-80"
            className="w-80"
            renderItem={(r, { isFront }) => (
                <div className="space-y-2">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{r.detail}</p>
                    <div className="flex gap-2">
                        <Button size="sm" color="violet" disabled={!isFront} onClick={() => resolve(r.id)}>
                            Allow
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => resolve(r.id)}>
                            Deny
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setFront((i) => i + 1)}>
                            Later
                        </Button>
                    </div>
                </div>
            )}
        />
    );
}

/**
 * Every corner the provider supports, typed against the package's own union so
 * this list cannot drift: adding a fifth position to `ToastPosition` without
 * adding it here is a type error, not a quietly incomplete example.
 */
const TOAST_POSITIONS: readonly ToastPosition[] = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
] as const;

function ToastDemo({ variant, label }: { variant?: "default" | "success" | "error" | "warning" | "info"; label: string }) {
    const { toast } = useToast();
    return (
        <Button
            onClick={() =>
                toast({
                    title: label,
                    description: "This toast was triggered from a button.",
                    variant,
                })
            }
        >
            {label}
        </Button>
    );
}

export const toastDoc: ComponentDoc = {
    intro: (
        <p>
            Transient notifications. Wrap your app in <code>ToastProvider</code> and call
            <code>useToast().toast(&#123;...&#125;)</code> from anywhere. Toasts auto-dismiss
            after their <code>duration</code> and can be dismissed manually.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Call `toast()` with a `title` to show a neutral notification.",
            render: () => (
                <Toast.Provider>
                    <ToastDemo label="Show toast" />
                </Toast.Provider>
            ),
            code: `function MyButton() {
    const { toast } = useToast();
    return (
        <Button onClick={() => toast({ title: "Saved" })}>
            Save
        </Button>
    );
}

// At the root of your app:
<Toast.Provider>
    <App />
</Toast.Provider>`,
        },
        {
            name: "Variants",
            description: "Five semantic variants — default, success, error, warning, info.",
            render: () => (
                <Toast.Provider>
                    <div className="flex flex-wrap gap-2">
                        <ToastDemo variant="default" label="default" />
                        <ToastDemo variant="success" label="success" />
                        <ToastDemo variant="error" label="error" />
                        <ToastDemo variant="warning" label="warning" />
                        <ToastDemo variant="info" label="info" />
                    </div>
                </Toast.Provider>
            ),
            code: `toast({ title: "Done", variant: "success" });
toast({ title: "Failed", variant: "error" });
toast({ title: "Heads up", variant: "warning" });
toast({ title: "FYI", variant: "info" });`,
        },
        {
            name: "Title + description",
            description: "Pair a short `title` with a longer `description` for richer context.",
            render: () => {
                function Demo() {
                    const { toast } = useToast();
                    return (
                        <Button
                            onClick={() =>
                                toast({
                                    title: "Backup complete",
                                    description: "All 2,431 files synced to cold storage.",
                                    variant: "success",
                                })
                            }
                        >
                            Show
                        </Button>
                    );
                }
                return (
                    <Toast.Provider>
                        <Demo />
                    </Toast.Provider>
                );
            },
            code: `toast({
    title: "Backup complete",
    description: "All 2,431 files synced to cold storage.",
    variant: "success",
});`,
        },
        {
            name: "Position",
            description:
                "Set the provider's `position` to corner-pin the toast stack. Each button below mounts its own provider — fire them in turn and watch the stack move corner to corner.",
            render: () => (
                // One provider PER corner, because `position` is a provider prop
                // rather than an argument to `toast()`. A single provider could
                // only ever demonstrate one corner — which is how this example
                // previously showed `bottom-right`, the default, and so appeared
                // to do nothing at all.
                <div className="flex flex-wrap gap-2">
                    {TOAST_POSITIONS.map((position) => (
                        <Toast.Provider key={position} position={position}>
                            <ToastDemo label={position} />
                        </Toast.Provider>
                    ))}
                </div>
            ),
            code: `<Toast.Provider position="top-left" maxToasts={5}>
    <App />
</Toast.Provider>`,
        },
        {
            name: "Toast.Item — building your own viewport",
            description:
                "The provider renders the stack for you, so most apps never touch this. If you render your own viewport, each item takes data (the toast record) and onDismiss (called with its id). They are listed here because a surface you can replace is only replaceable if its contract is written down.",
            render: () => (
                <div className="w-full rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                    Nothing to render — a second live toast viewport on this page would fight the
                    real one. The contract is in the code below.
                </div>
            ),
            code: `{/* Your own viewport, driven by the same records. */}
{toasts.map((toast) => (
    <Toast.Item
        key={toast.id}
        data={toast}
        onDismiss={(id) => dismiss(id)}
    />
))}`,
        },
        {
            name: "Toast.Stack — requests you walk through",
            description:
                "A controlled stack for things a person must act on, like an agent asking to add a database. It is a view of YOUR list: no timer, no limit, so nothing ever expires or drops. depth cards peek out behind the front one (offset px higher, scaleStep smaller) and anything beyond shows as +N. Hover and scroll to walk through them, or focus the stack and use the arrow keys; it wraps at both ends. renderItem renders any actions you like. Resolve the front request and the next comes forward. Here position is inline; by default it sits in a screen corner.",
            render: () => <StackDemo />,
            code: `const [requests, setRequests] = useState(pendingApprovals);
const [front, setFront] = useState(0);
const resolve = (id) => setRequests((all) => all.filter((r) => r.id !== id));

<Toast.Stack
    items={requests}
    getKey={(r) => r.id}
    depth={2}
    offset={8}
    scaleStep={0.05}
    frontIndex={front}
    onFrontIndexChange={setFront}
    position="bottom-right"
    label="Approval requests"
    cardClassName="w-80"
    renderItem={(r, { isFront }) => (
        <div>
            <p>{r.title}</p>
            <Button size="sm" disabled={!isFront} onClick={() => approve(r)}>Allow</Button>
            <Button size="sm" variant="ghost" onClick={() => resolve(r.id)}>Deny</Button>
        </div>
    )}
/>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "App tree. Mount the provider near the root." },
        { name: "position", type: `"top-right" | "top-left" | "bottom-right" | "bottom-left"`, default: `"bottom-right"`, description: "Where the toast stack anchors on screen." },
        { name: "maxToasts", type: `number`, default: `5`, description: "Maximum simultaneous toasts. Older ones drop off." },
        { name: "Toast.Item — data", type: `ToastData`, default: "—", description: "The toast record. Only needed when you render your own viewport.", required: true },
        { name: "Toast.Item — onDismiss", type: `(id: string) => void`, default: "—", description: "Called with the toast's id when it is dismissed.", required: true },
        { name: "Toast.Stack — items", type: `T[]`, default: "—", description: "Everything to show. The stack owns none of it: no timer, no limit; an item leaves only when you remove it.", required: true },
        { name: "Toast.Stack — renderItem", type: `(item, { index, isFront }) => ReactNode`, default: "—", description: "One card's content, actions included. Only the front card is interactive.", required: true },
        { name: "Toast.Stack — getKey", type: `(item, index) => string`, default: "`item.id`, then the index", description: "A stable key per item." },
        { name: "Toast.Stack — depth", type: `number`, default: `2`, description: "Cards shown behind the front one. The rest count as +N." },
        { name: "Toast.Stack — offset", type: `number`, default: `8`, description: "Pixels each card behind peeks out above the one in front." },
        { name: "Toast.Stack — scaleStep", type: `number`, default: `0.05`, description: "How much smaller each card behind is." },
        { name: "Toast.Stack — frontIndex", type: `number`, default: "—", description: "Which item is in front, if you own it. Wraps; clamped when the list shrinks." },
        { name: "Toast.Stack — defaultFrontIndex", type: `number`, default: `0`, description: "Initial front item when uncontrolled." },
        { name: "Toast.Stack — onFrontIndexChange", type: `(index: number) => void`, default: "—", description: "Called when the wheel or arrow keys move the front." },
        { name: "Toast.Stack — position", type: `ToastPosition | "inline"`, default: `"bottom-right"`, description: "A screen corner, or inline where it is placed." },
        { name: "Toast.Stack — label", type: `string`, default: `"Notifications"`, description: "The stack's accessible name." },
        { name: "Toast.Stack — cardClassName", type: `string`, default: "—", description: "Classes merged onto each card's shell." },
        { name: "Toast.Stack — className", type: `string`, default: "—", description: "Classes merged onto the stack." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>API:</strong> <code>const &#123; toast, dismiss &#125; = useToast()</code>.</p>
            <p><strong>toast() args:</strong> <code>&#123; title, description?, variant?, duration? &#125;</code>. Returns the toast's id; pass it to <code>dismiss(id)</code> to remove manually.</p>
        </div>
    ),
};
