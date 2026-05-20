import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const inputTagDoc: ComponentDoc = {
    intro: (
        <p>
            A pluggable trigger-character controller — the engine behind @mentions, #hashtags,
            <code>/commands</code>, and similar autocompletes inside text inputs. You give it
            an <code>adapter</code> (which describes the underlying surface — a
            <code>textarea</code>, the <code>PromptInput</code>, the <code>Composer</code>) and
            a <code>triggers</code> map, and it wires up the popover and keyboard navigation.
        </p>
    ),
    examples: [
        {
            name: "Concept",
            description: "Triggers map a character to a search + pick handler. The adapter knows how to read / write the underlying input.",
            render: () => (
                <div className="w-full max-w-md rounded-md border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
                    <Text size="xs" className="!font-mono !text-zinc-500">
                        See <code>react-fancy/src/components/InputTag/adapters.ts</code> for the textarea + Composer adapters.
                    </Text>
                </div>
            ),
            code: `// Wire @mentions in a plain <textarea>:
const ref = useRef<HTMLTextAreaElement>(null);
const adapter = useMemo(() => textareaAdapter(ref), [ref]);

const triggers = {
    "@": {
        search: async (query) => fetchUsers(query),
        renderItem: (user) => <UserRow user={user} />,
        onPick: (user, ctx) => ctx.replace(\`@\${user.username} \`),
    },
};

<InputTag adapter={adapter} triggers={triggers} />
<textarea ref={ref} className="…" />`,
        },
        {
            name: "Composer integration",
            description: "The Composer ships with its own InputTag wiring — drop slash-commands without writing the adapter yourself.",
            render: () => (
                <div className="w-full max-w-md rounded-md border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
                    <Text size="xs" className="!font-mono !text-zinc-500">
                        See the Composer component for the high-level slash-command pattern.
                    </Text>
                </div>
            ),
            code: `<Composer
    triggers={{
        "/": {
            search: searchCommands,
            renderItem: (cmd) => <CommandRow cmd={cmd} />,
            onPick: (cmd, ctx) => cmd.run(ctx),
        },
    }}
/>`,
        },
    ],
    props: [
        { name: "adapter", type: `InputTagAdapter`, default: "—", description: "Reads + writes the underlying input surface. Ships with adapters for `textarea` and `Composer`." },
        { name: "triggers", type: `Record<string, InputTagTrigger>`, default: "—", description: "Map from trigger character (`@`, `#`, `/`) to its search + pick implementation." },
        { name: "maxItems", type: `number`, default: `8`, description: "Max rows shown in the popover." },
        { name: "placement", type: `"bottom-left" | "bottom-right" | "top-left" | "top-right"`, default: `"bottom-left"`, description: "Where the popover anchors relative to the surface." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the popover container." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the popover container." },
        { name: "onPick", type: `(info: { triggerChar, query, item }) => void`, default: "—", description: "Called whenever any trigger picks an item — handy for analytics." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>InputTagTrigger shape:</strong> <code>&#123; search, renderItem, onPick &#125;</code>.
            <code>search(query)</code> returns matching items, <code>renderItem(item)</code>
            renders each row, <code>onPick(item, ctx)</code> writes the result back via the
            adapter context.
        </p>
    ),
};
