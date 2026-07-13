import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Editor, Text, Switch, Badge } from "@particle-academy/react-fancy";

function EditorViewEditDemo() {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(
        "## Field notes\n\nIn **view mode** the editor renders through `ContentRenderer` — _markdown_ in, prose out. Flip the switch to **edit**, revise, then flip back.\n\n- controlled `value` + `onChange`\n- same `FieldMode` resolution as the inputs",
    );
    return (
        <div className="w-full max-w-md">
            <div className="mb-2 flex items-center justify-between">
                <Switch checked={editing} onCheckedChange={setEditing} label={editing ? "Editing" : "Viewing"} />
                <Badge color="violet" variant="soft">{`mode="${editing ? "edit" : "view"}"`}</Badge>
            </div>
            <Editor value={value} onChange={setValue} outputFormat="markdown" mode={editing ? "edit" : "view"}>
                <Editor.Toolbar />
                <Editor.Content />
            </Editor>
        </div>
    );
}

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
            name: "View / edit mode",
            description: "`mode=\"view\"` renders the value read-only through `ContentRenderer` (matching `outputFormat`); flip to `\"edit\"` for the toolbar + contentEditable. Honors a surrounding `<Form mode>`, like the inputs — this is the inline-edit affordance.",
            render: () => <EditorViewEditDemo />,
            code: `const [editing, setEditing] = useState(false);
const [value, setValue] = useState("## Field notes…");

<Switch checked={editing} onCheckedChange={setEditing} label={editing ? "Editing" : "Viewing"} />

<Editor
    value={value}
    onChange={setValue}
    outputFormat="markdown"
    mode={editing ? "edit" : "view"}
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
            name: "Source view",
            description: "The default toolbar's Source toggle (`</>`) swaps the rich-text surface for a textarea of the raw markup — HTML, or Markdown under `outputFormat=\"markdown\"`. Edits round-trip back into the editor. Drive it with `showSource` / `onShowSourceChange`, or drop `<Editor.SourceToggle />` into a custom toolbar.",
            render: () => (
                <div className="w-full max-w-md">
                    <Editor defaultValue="<h2>Release notes</h2><p>Toggle <strong>Source</strong> to edit the raw HTML.</p>">
                        <Editor.Toolbar />
                        <Editor.Content />
                    </Editor>
                </div>
            ),
            code: `<Editor
    value={content}
    onChange={setContent}
    // optional: control the source view yourself
    showSource={showSource}
    onShowSourceChange={setShowSource}
>
    {/* default toolbar includes the Source toggle */}
    <Editor.Toolbar />
    <Editor.Content />
</Editor>

{/* …or place it in a custom toolbar */}
<Editor.Toolbar>
    <MyButtons />
    <Editor.SourceToggle className="ml-auto" />
</Editor.Toolbar>`,
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
        { name: "mode", type: `"edit" | "view"`, default: `"edit"`, description: "View/edit field mode (prop → `<Form>` context → `\"edit\"`). `\"view\"` renders read-only via `ContentRenderer`." },
        { name: "showSource", type: `boolean`, default: "—", description: "Controlled source-view flag. `true` shows the raw `value` (in `outputFormat`) in an editable textarea instead of the rich-text surface." },
        { name: "defaultShowSource", type: `boolean`, default: `false`, description: "Initial source-view state (uncontrolled)." },
        { name: "onShowSourceChange", type: `(showSource: boolean) => void`, default: "—", description: "Fired when the Source toggle flips source view on/off." },
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
