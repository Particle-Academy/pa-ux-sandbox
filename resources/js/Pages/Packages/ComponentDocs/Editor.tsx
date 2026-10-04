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
        {
            name: "showSourceToggle",
            description:
                "The default toolbar carries a source toggle at its right-hand end. Turn it off for an editor whose users should never see markup. It is ignored when you supply your own children — a custom toolbar composes its own <Editor.SourceToggle /> and so decides for itself.",
            render: () => (
                <Editor value="<p>No source toggle on this toolbar.</p>" onChange={() => {}}>
                    <Editor.Toolbar showSourceToggle={false} />
                    <Editor.Content />
                </Editor>
            ),
            code: `<Editor value={value} onChange={setValue}>
    <Editor.Toolbar showSourceToggle={false} />
    <Editor.Content />
</Editor>`,
        },
        {
            name: "A custom toolbar, with Editor.Toolbar.Separator",
            description:
                "Compose the toolbar yourself and the separator is a component rather than a border class, so every group divider in the app is the same one. Editor.SourceToggle goes wherever you want it — title and activeTitle are its accessible names in the two directions, which matters because the button means “go to source” once and “go back” the next time.",
            render: () => (
                <Editor value="<p>Custom toolbar above.</p>" onChange={() => {}}>
                    <Editor.Toolbar>
                        <Editor.Toolbar.Separator />
                        <Editor.SourceToggle title="Edit the markup" activeTitle="Back to rich text" />
                    </Editor.Toolbar>
                    <Editor.Content />
                </Editor>
            ),
            code: `<Editor value={value} onChange={setValue}>
    <Editor.Toolbar>
        <MyBoldButton />
        <Editor.Toolbar.Separator />
        <Editor.SourceToggle
            title="Edit the markup"
            activeTitle="Back to rich text"
        />
    </Editor.Toolbar>
    <Editor.Content />
</Editor>`,
        },
        {
            name: "sourceClassName",
            description:
                "Classes for the raw-source textarea shown while source mode is on. It is a different surface from the rich-text one — monospace, usually taller — and styling it through the editor's own className would hit both.",
            render: () => (
                <Editor value="<p>Toggle to source to see the styled textarea.</p>" onChange={() => {}}>
                    <Editor.Toolbar />
                    <Editor.Content sourceClassName="font-mono text-xs bg-zinc-950 text-zinc-100" />
                </Editor>
            ),
            code: `<Editor value={value} onChange={setValue}>
    <Editor.Toolbar />
    <Editor.Content sourceClassName="font-mono text-xs bg-zinc-950 text-zinc-100" />
</Editor>`,
        },
        {
            name: "valueFormat — say what you are handing in",
            description:
                "Defaults to \"auto\", which sniffs whether the incoming value is markdown or HTML. The sniff is a guess, and a document that is ambiguous — plain prose with no markup in it at all — can be read either way. Any app that knows its storage format should declare it: an explicit value bypasses the sniff entirely, in edit mode AND view mode.",
            render: () => (
                <div className="w-full space-y-4">
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">valueFormat="markdown"</p>
                        <Editor
                            value={"**Bold** and _italic_, declared as markdown."}
                            onChange={() => {}}
                            valueFormat="markdown"
                            mode="view"
                        >
                            <Editor.Content />
                        </Editor>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">valueFormat="html"</p>
                        <Editor
                            value={"<p><strong>Bold</strong> and <em>italic</em>, declared as HTML.</p>"}
                            onChange={() => {}}
                            valueFormat="html"
                            mode="view"
                        >
                            <Editor.Content />
                        </Editor>
                    </div>
                </div>
            ),
            code: `{/* You know what your column holds — do not make the editor guess. */}
<Editor value={post.body} onChange={save} valueFormat="markdown" />`,
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
        { name: "Editor.Toolbar — showSourceToggle", type: `boolean`, default: `true`, description: "Source toggle on the default toolbar. Ignored when you supply your own children." },
        { name: "Editor.Content — sourceClassName", type: `string`, default: "—", description: "Classes for the raw-source textarea shown in source mode." },
        { name: "valueFormat", type: `"markdown" | "html" | "auto"`, default: `"auto"`, description: "What the incoming value IS. Explicit bypasses the sniff, in edit and view mode." },
        { name: "Editor.SourceToggle — title", type: `string`, default: `"Source"`, description: "Accessible title in rich-text mode (click → source)." },
        { name: "Editor.SourceToggle — activeTitle", type: `string`, default: `"Rich text"`, description: "Accessible title in source mode (click → rich text)." },
        { name: "Editor.Toolbar.Separator", type: `component`, default: "—", description: "Group divider for a custom toolbar — a component, not a border class." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Security:</strong> the initial value is sanitized (script/iframe/handlers stripped)
            unless <code>unsafe</code> is true. The same sanitization rules apply when rendering the
            output via <code>ContentRenderer</code>.
        </p>
    ),
};
