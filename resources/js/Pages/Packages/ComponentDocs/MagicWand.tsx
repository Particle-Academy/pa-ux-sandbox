import type { ComponentDoc } from "./types";
import { useState } from "react";
import { MagicWand } from "@particle-academy/react-fancy";

function MagicWandDemo() {
    const [value, setValue] = useState("Highlight some of this text. Then a wand appears beside your selection.\n\nClick a wand action — Rewrite, Shorten, Expand — to ship the selected text to your handler and swap in the result.");
    return (
        <div className="w-full max-w-md">
            <MagicWand
                value={value}
                onValueChange={setValue}
                rows={6}
                actions={[
                    {
                        id: "rewrite",
                        label: "Rewrite",
                        run: async (selection) => `[rewritten: ${selection}]`,
                    },
                    {
                        id: "shorten",
                        label: "Shorten",
                        run: async (selection) => selection.slice(0, Math.max(8, selection.length / 2)),
                    },
                ]}
            />
        </div>
    );
}

export const magicWandDoc: ComponentDoc = {
    intro: (
        <p>
            A textarea with a context-aware action wand. Select text and a small floating
            menu appears beside the selection — pick an action ("Rewrite", "Shorten",
            "Translate"), and the action's <code>run()</code> returns a replacement for the
            selection. Perfect for AI-assisted editing UI.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Select any text — the wand appears beside the selection.",
            render: () => <MagicWandDemo />,
            code: `<MagicWand
    value={text}
    onValueChange={setText}
    actions={[
        {
            id: "rewrite",
            label: "Rewrite",
            run: async (selection) => {
                const res = await fetch("/api/rewrite", {
                    method: "POST",
                    body: JSON.stringify({ text: selection }),
                });
                const { rewritten } = await res.json();
                return rewritten;
            },
        },
        {
            id: "shorten",
            label: "Shorten",
            run: async (selection) => callLLM(\`Make this shorter:\\n\${selection}\`),
        },
    ]}
/>`,
        },
        {
            name: "Pill appearance",
            description: "`appearance=\"pill\"` is the compact form: each action shows only the first letter of its label, and the character count is dropped.",
            render: () => (
                <div className="w-full max-w-md">
                    <MagicWand
                        value="Select some of this text to see the compact pill wand."
                        onValueChange={() => {}}
                        appearance="pill"
                        rows={4}
                        actions={[
                            { id: "rewrite", label: "Rewrite", run: async (s) => s },
                            { id: "translate", label: "Translate", run: async (s) => s },
                        ]}
                    />
                </div>
            ),
            code: `<MagicWand
    value={text}
    onValueChange={setText}
    appearance="pill"
    actions={actions}
/>`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Controlled value, of the built-in textarea or of `target`. Required." },
        { name: "onValueChange", type: `(value: string) => void`, default: "—", description: "Called on every edit. Required." },
        { name: "actions", type: `MagicWandAction[]`, default: "—", description: "List of wand actions. Each is `{ id, label, run(selection) => Promise<string> }`." },
        { name: "target", type: `RefObject<HTMLTextAreaElement | HTMLInputElement> | MagicWandTargetAdapter`, default: "—", description: "Since 5.51.0. Act on a field or editor the host renders: MagicWand then renders no textarea, only the wand, floated over the selection. A ref to your textarea / input works as is (`<MagicWand target={ref} value={text} onValueChange={setText} … />`); for a code editor or contenteditable pass a read-only adapter `{ element, getSelection: () => ({ start, end }) | null, getSelectionRect? }`, offsets into `value`. The write still goes through `onValueChange`." },
        { name: "appearance", type: `"floating" | "pill"`, default: `"floating"`, description: "`floating` shows full labels and the selection's character count; `pill` is compact, first letter only." },
        { name: "autoHide", type: `boolean`, default: `true`, description: "Auto-hide the floating wand on click-away / scroll." },
        { name: "rows", type: `number`, default: `6`, description: "Initial textarea rows." },
        { name: "placeholder", type: `string`, default: "—", description: "Textarea placeholder." },
        { name: "onAction", type: `(action, selection, replacement) => void`, default: "—", description: "Called after an action runs and the replacement is applied — handy for analytics." },
    ],
};
