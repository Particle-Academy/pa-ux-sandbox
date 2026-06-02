import type { ComponentDoc } from "./types";
import { Button, Toast, useToast } from "@particle-academy/react-fancy";

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
            description: "Set the provider's `position` to corner-pin the toast stack.",
            render: () => (
                <Toast.Provider position="bottom-right">
                    <ToastDemo label="Bottom-right" />
                </Toast.Provider>
            ),
            code: `<ToastProvider position="bottom-right" maxToasts={5}>
    <App />
</Toast.Provider>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "App tree. Mount the provider near the root." },
        { name: "position", type: `"top-right" | "top-left" | "bottom-right" | "bottom-left"`, default: `"top-right"`, description: "Where the toast stack anchors on screen." },
        { name: "maxToasts", type: `number`, default: `5`, description: "Maximum simultaneous toasts. Older ones drop off." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>API:</strong> <code>const &#123; toast, dismiss &#125; = useToast()</code>.</p>
            <p><strong>toast() args:</strong> <code>&#123; title, description?, variant?, duration? &#125;</code>. Returns the toast's id; pass it to <code>dismiss(id)</code> to remove manually.</p>
        </div>
    ),
};
