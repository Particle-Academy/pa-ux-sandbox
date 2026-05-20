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
                        run: async (selection) => `[rewritten: ${selection.text}]`,
                    },
                    {
                        id: "shorten",
                        label: "Shorten",
                        run: async (selection) => selection.text.slice(0, Math.max(8, selection.text.length / 2)),
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
                    body: JSON.stringify({ text: selection.text }),
                });
                const { rewritten } = await res.json();
                return rewritten;
            },
        },
        {
            id: "shorten",
            label: "Shorten",
            run: async (selection) => callLLM(\`Make this shorter:\\n\${selection.text}\`),
        },
    ]}
/>`,
        },
        {
            name: "Inline appearance",
            description: "`appearance=\"inline\"` pins the wand under the textarea instead of floating beside the selection.",
            render: () => (
                <div className="w-full max-w-md">
                    <MagicWand
                        value="Selecting text shows an inline action row beneath the textarea."
                        onValueChange={() => {}}
                        appearance="inline"
                        rows={4}
                        actions={[
                            { id: "rewrite", label: "Rewrite", run: async (s) => s.text },
                            { id: "translate", label: "Translate", run: async (s) => s.text },
                        ]}
                    />
                </div>
            ),
            code: `<MagicWand
    value={text}
    onValueChange={setText}
    appearance="inline"
    actions={actions}
/>`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Controlled textarea value. Required." },
        { name: "onValueChange", type: `(value: string) => void`, default: "—", description: "Called on every edit. Required." },
        { name: "actions", type: `MagicWandAction[]`, default: "—", description: "List of wand actions. Each is `{ id, label, run(selection) => Promise<string> }`." },
        { name: "appearance", type: `"floating" | "inline"`, default: `"floating"`, description: "Floating beside the selection or pinned below the textarea." },
        { name: "autoHide", type: `boolean`, default: `true`, description: "Auto-hide the floating wand on click-away / scroll." },
        { name: "rows", type: `number`, default: `6`, description: "Initial textarea rows." },
        { name: "placeholder", type: `string`, default: "—", description: "Textarea placeholder." },
        { name: "onAction", type: `(action, selection, replacement) => void`, default: "—", description: "Called after an action runs and the replacement is applied — handy for analytics." },
    ],
};
