import type { ComponentDoc } from "./types";
import { Kbd, Text } from "@particle-academy/react-fancy";

export const kbdDoc: ComponentDoc = {
    intro: (
        <p>
            A keyboard key cap. Pass a single key as <code>children</code>, or a chord as{" "}
            <code>keys</code> — which renders separate caps with a separator between them,
            rather than one wide cap reading &ldquo;Cmd K&rdquo;. That distinction is the
            whole reason the prop exists: a chord is several keys, and drawing it as one
            cap tells the reader to look for a key that is not on their keyboard.
        </p>
    ),
    examples: [
        {
            name: "A single key",
            description: "children is one cap.",
            render: () => <Kbd>Esc</Kbd>,
            code: `<Kbd>Esc</Kbd>`,
        },
        {
            name: "A chord",
            description:
                "keys renders one cap per key with a separator between them. Compare the two rows: the first is three caps, the second is one cap containing a sentence.",
            render: () => (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Kbd keys={["Cmd", "Shift", "P"]} />
                        <Text className="text-xs text-zinc-500">
                            keys={"{"}[&quot;Cmd&quot;, &quot;Shift&quot;, &quot;P&quot;]{"}"} — correct
                        </Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <Kbd>Cmd Shift P</Kbd>
                        <Text className="text-xs text-zinc-500">
                            one cap — reads as a key that does not exist
                        </Text>
                    </div>
                </div>
            ),
            code: `<Kbd keys={["Cmd", "Shift", "P"]} />`,
        },
        {
            name: "Separator",
            description:
                "Defaults to +. Some design languages prefer a thin space or a glyph; pass whatever the design calls for, including a node.",
            render: () => (
                <div className="flex flex-wrap items-center gap-4">
                    <Kbd keys={["Ctrl", "C"]} />
                    <Kbd keys={["Ctrl", "C"]} separator="then" />
                    <Kbd keys={["Ctrl", "C"]} separator=" " />
                    <Kbd
                        keys={["Ctrl", "C"]}
                        separator={<span className="text-zinc-400">›</span>}
                    />
                </div>
            ),
            code: `<Kbd keys={["Ctrl", "C"]} />
<Kbd keys={["Ctrl", "C"]} separator="then" />
<Kbd keys={["Ctrl", "C"]} separator=" " />
<Kbd keys={["Ctrl", "C"]} separator={<span>›</span>} />`,
        },
        {
            name: "Sizes",
            description:
                "xs fits inside a menu row or a table cell, sm is the default reading size beside body text, md stands alone in a shortcuts panel.",
            render: () => (
                <div className="flex flex-wrap items-end gap-3">
                    <Kbd size="xs" keys={["Cmd", "K"]} />
                    <Kbd size="sm" keys={["Cmd", "K"]} />
                    <Kbd size="md" keys={["Cmd", "K"]} />
                </div>
            ),
            code: `<Kbd size="xs" keys={["Cmd", "K"]} />
<Kbd size="sm" keys={["Cmd", "K"]} />
<Kbd size="md" keys={["Cmd", "K"]} />`,
        },
        {
            name: "Inline in prose",
            description:
                "A key cap is an inline element, so it sits in a sentence without breaking the line box.",
            render: () => (
                <Text>
                    Press <Kbd size="xs" keys={["Cmd", "K"]} /> to open the command palette,
                    or <Kbd size="xs">Esc</Kbd> to dismiss it.
                </Text>
            ),
            code: `<Text>
    Press <Kbd size="xs" keys={["Cmd", "K"]} /> to open the command palette,
    or <Kbd size="xs">Esc</Kbd> to dismiss it.
</Text>`,
        },
        {
            name: "A shortcuts table",
            description:
                "The densest real use: one cap per row, aligned. Symbols work as well as words — pass whichever the platform convention calls for.",
            render: () => (
                <div className="space-y-2 text-sm">
                    {[
                        { keys: ["⌘", "K"], what: "Command palette" },
                        { keys: ["⌘", "/"], what: "Toggle sidebar" },
                        { keys: ["⌘", "⇧", "D"], what: "Duplicate" },
                        { keys: ["Esc"], what: "Dismiss" },
                    ].map((row) => (
                        <div
                            key={row.what}
                            className="flex items-center justify-between gap-6 border-b border-zinc-100 pb-2 dark:border-zinc-800"
                        >
                            <span className="text-zinc-600 dark:text-zinc-300">{row.what}</span>
                            <Kbd size="xs" keys={row.keys} />
                        </div>
                    ))}
                </div>
            ),
            code: `{shortcuts.map((row) => (
    <div key={row.what} className="flex items-center justify-between">
        <span>{row.what}</span>
        <Kbd size="xs" keys={row.keys} />
    </div>
))}`,
        },
    ],
    props: [
        { name: "keys", type: `ReactNode[]`, default: "—", description: "Render a chord as separate caps. Prefer this over a space-joined string." },
        { name: "separator", type: `ReactNode`, default: `"+"`, description: "Drawn between chord keys." },
        { name: "size", type: `"xs" | "sm" | "md"`, default: `"sm"`, description: "Cap size. `xs` for table rows and menus, `md` to stand alone." },
        { name: "children", type: `ReactNode`, default: "—", description: "A single key. Use `keys` for a chord." },
        { name: "...rest", type: `HTMLAttributes<HTMLElement>`, default: "—", description: "All standard attributes." },
    ],
    notes: (
        <ul>
            <li>
                Renders a real <code>&lt;kbd&gt;</code> element, which is what assistive
                technology and reader modes look for. A styled <code>span</code> looks
                identical and carries none of that.
            </li>
            <li>
                The component displays a shortcut; it does not bind one. Wire the handler
                yourself — usually to <code>Command</code>, which owns the palette this is
                most often labelling.
            </li>
        </ul>
    ),
};
