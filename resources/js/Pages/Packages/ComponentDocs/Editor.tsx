import type { ComponentDoc } from "./types";
import { Editor, Text } from "@particle-academy/react-fancy";

export const editorDoc: ComponentDoc = {
    intro: (
        <p>
            A lightweight WYSIWYG rich-text editor. Compound:
            <code>Editor.Toolbar</code> (formatting actions) and
            <code>Editor.Content</code> (the contentEditable surface). Emits markdown or HTML
            via <code>outputFormat</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Default toolbar + content. Editor outputs HTML.",
            render: () => (
                <div className="w-full max-w-md">
                    <Editor
                        defaultValue="<p>Start typing…</p>"
                        onChange={() => {}}
                        placeholder="Write something brilliant"
                    >
                        <Editor.Toolbar />
                        <Editor.Content />
                    </Editor>
                </div>
            ),
            code: `const [content, setContent] = useState("");

<Editor
    value={content}
    onChange={setContent}
    placeholder="Write something brilliant"
>
    <Editor.Toolbar />
    <Editor.Content />
</Editor>`,
        },
        {
            name: "Markdown output",
            description: "`outputFormat=\"markdown\"` returns CommonMark.",
            render: () => (
                <div className="w-full max-w-md">
                    <Editor defaultValue="**Hello** _editor_" outputFormat="markdown">
                        <Editor.Toolbar />
                        <Editor.Content />
                    </Editor>
                </div>
            ),
            code: `<Editor
    value={mdContent}
    onChange={setMdContent}
    outputFormat="markdown"
>
    <Editor.Toolbar />
    <Editor.Content />
</Editor>`,
        },
        {
            name: "Custom toolbar actions",
            description: "Pass an `actions` array to drop the defaults and ship your own button set.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Each <code>action</code> = <code>&#123; icon, label, command, commandArg?, active? &#125;</code>. Wire <code>onAction</code> to your own dispatcher.
                </Text>
            ),
            code: `<Editor>
    <Editor.Toolbar
        actions={[
            { icon: <BoldIcon />, label: "Bold", command: "bold" },
            { icon: <ItalicIcon />, label: "Italic", command: "italic" },
            { icon: <LinkIcon />, label: "Link", command: "createLink" },
        ]}
        onAction={(command) => {
            // optional — handle the action externally
        }}
    />
    <Editor.Content maxHeight={400} />
</Editor>`,
        },
        {
            name: "Scrollable content",
            description: "Set `maxHeight` on `Editor.Content` to cap height and scroll the body.",
            render: () => (
                <div className="w-full max-w-md">
                    <Editor defaultValue="<p>Long content area…</p>">
                        <Editor.Toolbar />
                        <Editor.Content maxHeight={200} />
                    </Editor>
                </div>
            ),
            code: `<Editor>
    <Editor.Toolbar />
    <Editor.Content maxHeight={400} />
</Editor>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Compound parts — `Editor.Toolbar` + `Editor.Content`." },
        { name: "value", type: `string`, default: "—", description: "Controlled value (HTML or markdown based on `outputFormat`). Pair with `onChange`." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial value (uncontrolled)." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called on every edit." },
        { name: "outputFormat", type: `"html" | "markdown"`, default: `"html"`, description: "Emitted format for `value` / `onChange`." },
        { name: "lineSpacing", type: `number`, default: `1.5`, description: "Multiplier on paragraph line height." },
        { name: "placeholder", type: `string`, default: "—", description: "Placeholder shown when the editor is empty." },
        { name: "extensions", type: `RenderExtension[]`, default: "—", description: "Per-instance render extensions. Merged with globally registered ones." },
        { name: "unsafe", type: `boolean`, default: `false`, description: "Skip sanitization of the initial value. Only use for fully trusted content." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Security:</strong> the initial value is sanitized (script/iframe/handlers stripped)
            unless <code>unsafe</code> is true. The same sanitization rules apply when rendering the
            output via <code>ContentRenderer</code>.
        </p>
    ),
};
