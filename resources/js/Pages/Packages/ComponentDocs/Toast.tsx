import type { ComponentDoc } from "./types";
import type { ToastPosition } from "@particle-academy/react-fancy";
import { Button, Toast, useToast } from "@particle-academy/react-fancy";

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
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "App tree. Mount the provider near the root." },
        { name: "position", type: `"top-right" | "top-left" | "bottom-right" | "bottom-left"`, default: `"bottom-right"`, description: "Where the toast stack anchors on screen." },
        { name: "maxToasts", type: `number`, default: `5`, description: "Maximum simultaneous toasts. Older ones drop off." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>API:</strong> <code>const &#123; toast, dismiss &#125; = useToast()</code>.</p>
            <p><strong>toast() args:</strong> <code>&#123; title, description?, variant?, duration? &#125;</code>. Returns the toast's id; pass it to <code>dismiss(id)</code> to remove manually.</p>
        </div>
    ),
};
