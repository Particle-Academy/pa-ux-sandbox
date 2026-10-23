import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, Checkbox, CheckboxGroup, ColorPicker, DatePicker, Field, Input, MultiSwitch, RadioGroup, Select, Slider, Switch, Textarea } from "@particle-academy/react-fancy";

const inputFamilyDoc: ComponentDoc = {
    intro: (
        <p>
            The form-input family. Every input shares a common base (<code>label</code>,
            <code>description</code>, <code>error</code>, <code>size</code>,
            <code>disabled</code>) so they slot into forms uniformly. <code>Field</code> is a
            layout shell if you need to compose a custom input with the same labeling.
        </p>
    ),
    examples: [
        {
            name: "Input",
            description: "Single-line text. Native HTML attrs pass through; use `onValueChange` for the cleaned string.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Input
                        label="Email"
                        description="We'll never spam you."
                        required
                        type="email"
                        placeholder="you@example.com"
                    />
                </div>
            ),
            code: `<Input
    label="Email"
    description="We'll never spam you."
    required
    type="email"
    value={email}
    onValueChange={setEmail}
    placeholder="you@example.com"
/>`,
        },
        {
            name: "Error state",
            description: "Pass `error` to any input to red the border and show an inline message.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Input label="Username" error="That username is taken." defaultValue="avery" required />
                </div>
            ),
            code: `<Input
    label="Username"
    error="That username is taken."
    value={username}
    onValueChange={setUsername}
    required
/>`,
        },
        {
            name: "Affixes",
            description: "`leading` / `trailing` (or `prefix` / `suffix`) drop content inside the input frame.",
            render: () => (
                <div className="w-full max-w-sm space-y-2">
                    <Input label="Domain" leading="https://" defaultValue="fancy.app" />
                    <Input label="Amount" trailing="USD" type="number" defaultValue={42} />
                </div>
            ),
            code: `<Input label="Domain" leading="https://" value={url} onValueChange={setUrl} />
<Input label="Amount" trailing="USD" type="number" value={amount} onValueChange={setAmount} />`,
        },
        {
            name: "Paste pills",
            description:
                "pasteThreshold holds a long paste as a pill in the field, the same pill Composer and PromptInput show, from the same PastePills code. Click it to put the text back; hover for the first and last previewChars. pasteImages holds a pasted screenshot as a pill too, and puts the file in a hidden file input in the same form, named pasteFilesName (default {name}_files[]). A plain form submit posts the text with every pill expanded, plus the files. Paste below and submit to see what the form posts. pasteClassNames and renderPastePreview restyle the pills; heldPastes / onHeldPastesChange and heldImages / onHeldImagesChange hand you the held lists.",
            render: () => <PastePillsForm />,
            code: `<form method="post" action="/ask" encType="multipart/form-data">
    <Input
        name="question"
        label="Question"
        pasteThreshold={500}
        pasteImages
        pasteFilesName="screenshots[]"
        previewChars={30}
        pasteClassNames={{ textPill: "bg-violet-100 text-violet-700" }}
        renderPastePreview={(p) => (p.kind === "text" ? p.paste.text.slice(0, 60) : p.image.label)}
        heldPastes={held}
        onHeldPastesChange={setHeld}
        heldImages={images}
        onHeldImagesChange={setImages}
    />
</form>
{/* posts question = the text with each pill expanded, screenshots[] = the pasted files */}`,
        },
        {
            name: "Textarea",
            description: "Multi-line text. Set `autoResize` for the message-box pattern.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Textarea
                        label="Bio"
                        description="Two or three sentences is plenty."
                        rows={3}
                        placeholder="Tell us about yourself…"
                    />
                </div>
            ),
            code: `<Textarea
    label="Bio"
    description="Two or three sentences is plenty."
    rows={3}
    value={bio}
    onValueChange={setBio}
    autoResize
    minRows={3}
    maxRows={10}
/>`,
        },
        {
            name: "Select",
            description: "Native by default. Pass `list` as an array of strings or `{ value, label, disabled? }`.",
            render: () => (
                <div className="w-full max-w-sm space-y-2">
                    <Select
                        label="Plan"
                        list={[
                            { value: "free", label: "Free" },
                            { value: "pro", label: "Pro" },
                            { value: "enterprise", label: "Enterprise" },
                        ]}
                        defaultValue="pro"
                    />
                </div>
            ),
            code: `<Select
    label="Plan"
    list={[
        { value: "free", label: "Free" },
        { value: "pro", label: "Pro" },
        { value: "enterprise", label: "Enterprise" },
    ]}
    value={plan}
    onValueChange={setPlan}
/>`,
        },
        {
            name: "Checkbox & CheckboxGroup",
            description: "Single boolean uses `label`. Groups use `list` + `value` (array) + `onValueChange`.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <Checkbox label="Subscribe to the changelog" defaultChecked />
                    <CheckboxGroup
                        label="Notifications"
                        list={[
                            { value: "email", label: "Email" },
                            { value: "in-app", label: "In-app" },
                            { value: "mobile", label: "Mobile push" },
                        ]}
                        defaultValue={["email", "in-app"]}
                    />
                </div>
            ),
            code: `<Checkbox
    label="Subscribe to the changelog"
    checked={subscribe}
    onCheckedChange={setSubscribe}
/>

<CheckboxGroup
    label="Notifications"
    list={[
        { value: "email", label: "Email" },
        { value: "in-app", label: "In-app" },
        { value: "mobile", label: "Mobile push" },
    ]}
    value={channels}
    onValueChange={setChannels}
/>`,
        },
        {
            name: "RadioGroup",
            description: "Single-pick. `list` + `value` (single) + `onValueChange`.",
            render: () => (
                <div className="w-full max-w-sm">
                    <RadioGroup
                        label="Theme"
                        list={[
                            { value: "system", label: "Match system" },
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" },
                        ]}
                        defaultValue="system"
                    />
                </div>
            ),
            code: `<RadioGroup
    label="Theme"
    list={[
        { value: "system", label: "Match system" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
    ]}
    value={theme}
    onValueChange={setTheme}
/>`,
        },
        {
            name: "Switch & MultiSwitch",
            description: "`Switch` is a boolean toggle with `onCheckedChange`. `MultiSwitch` is a segmented pick-one control.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <Switch label="Auto-save" defaultChecked />
                    <MultiSwitch
                        label="Mode"
                        list={[
                            { value: "list", label: "List" },
                            { value: "grid", label: "Grid" },
                            { value: "kanban", label: "Kanban" },
                        ]}
                        defaultValue="list"
                    />
                </div>
            ),
            code: `<Switch
    label="Auto-save"
    checked={autoSave}
    onCheckedChange={setAutoSave}
/>

<MultiSwitch
    label="Mode"
    list={[
        { value: "list", label: "List" },
        { value: "grid", label: "Grid" },
        { value: "kanban", label: "Kanban" },
    ]}
    value={mode}
    onValueChange={setMode}
/>`,
        },
        {
            name: "MultiSwitch colours",
            description:
                "Give an option a `color` and, while it is selected, the thumb and the border take it: a green Assign against a red Unassign. Light hues get dark label text. An option without one keeps the default blue.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <MultiSwitch
                        label="Shift"
                        list={[
                            { value: "assign", label: "Assign", color: "green" },
                            { value: "unassign", label: "Unassign", color: "red" },
                            { value: "hold", label: "Hold", color: "amber" },
                            { value: "skip", label: "Skip" },
                        ]}
                        defaultValue="assign"
                    />
                </div>
            ),
            code: `<MultiSwitch
    label="Shift"
    list={[
        { value: "assign", label: "Assign", color: "green" },
        { value: "unassign", label: "Unassign", color: "red" },
        { value: "hold", label: "Hold", color: "amber" },
        { value: "skip", label: "Skip" },          // default blue
    ]}
    value={action}
    onValueChange={setAction}
/>`,
        },
        {
            name: "Slider",
            description: "Numeric range. Defaults to single-value mode; opt into `range` for two thumbs.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <Slider label="Volume" defaultValue={60} min={0} max={100} />
                    <Slider label="Price range" range defaultValue={[20, 80]} min={0} max={100} />
                </div>
            ),
            code: `<Slider
    label="Volume"
    value={volume}
    onValueChange={setVolume}
    min={0}
    max={100}
/>

<Slider
    range
    label="Price range"
    value={[low, high]}
    onValueChange={([l, h]) => { setLow(l); setHigh(h); }}
    min={0}
    max={100}
/>`,
        },
        {
            name: "DatePicker",
            description: "Single dates and ranges use the same controlled value API.",
            render: () => (
                <div className="w-full max-w-sm space-y-3">
                    <DatePicker label="Launch date" defaultValue="2026-10-01" />
                    <DatePicker label="Campaign window" range defaultValue={["2026-10-01", "2026-10-14"]} />
                </div>
            ),
            code: `<DatePicker
    label="Launch date"
    value={launchDate}
    onValueChange={setLaunchDate}
/>

<DatePicker
    label="Campaign window"
    range
    value={window}
    onValueChange={setWindow}
/>`,
        },
        {
            name: "Field (wrapping another control)",
            description: "Use `Field` directly to give any control the same label + description + error treatment. It wraps Fancy components — reach for a raw `<input>` only when the kit genuinely has nothing, which is a gap worth reporting rather than routing around.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Field label="Color" description="Hex value">
                        <ColorPicker defaultValue="#8b5cf6" presets={["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]} />
                    </Field>
                </div>
            ),
            code: `<Field label="Color" description="Hex value">
    <ColorPicker value={color} onChange={setColor} />
</Field>`,
        },
        {
            name: "labelHidden",
            description:
                "Keeps the label in the accessible tree and takes it off the screen. For a control whose options already say what it does — a filter toolbar's segmented switches, say — where a visible label is noise but an unnamed control is a bug. Without this the only choices were an unnamed control or a label the design does not have, and the silent one is the one that ships.",
            render: () => (
                <div className="flex w-full flex-wrap items-center gap-4">
                    <Field label="Search documents" labelHidden>
                        <Input placeholder="Search…" />
                    </Field>
                    <Field label="Sort direction" labelHidden>
                        <MultiSwitch
                            value="asc"
                            list={[
                                { value: "asc", label: "Ascending" },
                                { value: "desc", label: "Descending" },
                            ]}
                        />
                    </Field>
                </div>
            ),
            code: `{/* Named for a screen reader, invisible on screen. */}
<Field label="Search documents" labelHidden>
    <Input placeholder="Search…" />
</Field>`,
        },
        {
            name: "dirty",
            description:
                "Marks a field whose value has been changed and not yet saved — the affordance an autosaving form needs so “nothing happened” and “saved already” do not look identical.",
            render: () => (
                <div className="w-full max-w-sm space-y-4">
                    <Field label="Project name">
                        <Input value="Untouched" onChange={() => {}} />
                    </Field>
                    <Field label="Project name">
                        <Input value="Edited, not saved" onChange={() => {}} dirty />
                    </Field>
                </div>
            ),
            code: `<Input value={value} onChange={setValue} dirty={value !== saved} />`,
        },
        {
            name: "Affix position",
            description:
                "prefixPosition and suffixPosition decide whether an affix sits inside the control's border or outside it. Inside reads as part of the value — a currency symbol, a unit. Outside reads as a separate control or label — a domain suffix, an action.",
            render: () => (
                <div className="w-full max-w-sm space-y-4">
                    <Field label="Amount">
                        <Input value="24.00" onChange={() => {}} prefix="£" prefixPosition="inside" />
                    </Field>
                    <Field label="Subdomain">
                        <Input
                            value="acme"
                            onChange={() => {}}
                            suffix=".particle.academy"
                            suffixPosition="outside"
                        />
                    </Field>
                </div>
            ),
            code: `{/* Part of the value. */}
<Input prefix="£" prefixPosition="inside" />

{/* Beside the value. */}
<Input suffix=".particle.academy" suffixPosition="outside" />`,
        },
    ],
    props: [
        { name: "Input", type: "—", default: "—", description: "Single-line text. `value` / `onValueChange`, plus `type`, `leading`, `trailing`." },
        { name: "Textarea", type: "—", default: "—", description: "Multi-line text. Optional `autoResize`, `minRows`, `maxRows`." },
        { name: "Select", type: "—", default: "—", description: "`list` + `value` + `onValueChange`. Variant `\"listbox\"` enables search + multi-select." },
        { name: "Checkbox", type: "—", default: "—", description: "Single boolean. `label`, `checked`, `onCheckedChange`, `indeterminate`." },
        { name: "CheckboxGroup", type: "—", default: "—", description: "`list` + `value` (array) + `onValueChange`." },
        { name: "RadioGroup", type: "—", default: "—", description: "`list` + `value` (single) + `onValueChange`." },
        { name: "Switch", type: "—", default: "—", description: "Boolean toggle. `label`, `checked`, `onCheckedChange`, `color`." },
        { name: "MultiSwitch", type: "—", default: "—", description: "Segmented pick-one. `list` + `value` + `onValueChange`." },
        { name: "Slider", type: "—", default: "—", description: "Single or range numeric. `value` / `onValueChange`, `min`, `max`, `step`. `range` switches to two-thumb mode." },
        { name: "DatePicker", type: "—", default: "—", description: "Calendar-anchored date input with `single` and `range` modes." },
        { name: "Field", type: "—", default: "—", description: "Labeling shell — `label`, `description`, `error`, `required`, `htmlFor`, `size` + arbitrary children." },
        { name: "labelHidden", type: `boolean`, default: `false`, description: "Keep the label for assistive tech, hide it on screen." },
        { name: "dirty", type: `boolean`, default: `false`, description: "Mark a field changed but not yet saved." },
        { name: "prefixPosition", type: `"inside" | "outside"`, default: `"inside"`, description: "Whether the prefix sits inside the control's border." },
        { name: "suffixPosition", type: `"inside" | "outside"`, default: `"inside"`, description: "Whether the suffix sits inside the control's border." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Common base props:</strong> every input accepts <code>size</code>,
            <code>label</code>, <code>description</code>, <code>error</code>,
            <code>required</code>, <code>disabled</code>, <code>id</code>, <code>name</code>,
            <code>className</code>. The label / description / error layout is the same across
            every input, so forms look consistent.
        </p>
    ),
};

function componentDoc(
    name: string,
    description: string,
    exampleNames: string[],
): ComponentDoc {
    return {
        intro: (
            <p>
                <code>{name}</code> {description}
            </p>
        ),
        examples: inputFamilyDoc.examples.filter((example) => exampleNames.includes(example.name)),
        props: inputFamilyDoc.props.filter((prop) => prop.name === name),
        notes: inputFamilyDoc.notes,
    };
}

export const fieldDoc = componentDoc("Field", "provides the shared accessible label, description and validation shell.", ["Field (wrapping another control)"]);
export const inputDoc = componentDoc("Input", "is the controlled single-line text primitive.", ["Input", "Error state", "Affixes", "Paste pills"]);

/** A real form, so the example shows what a native submit posts rather than describing it. */
function PastePillsForm() {
    const [posted, setPosted] = useState<string | null>(null);

    return (
        <form
            className="w-full max-w-md space-y-3"
            onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const question = String(data.get("question") ?? "");
                const files = data.getAll("screenshots[]").filter((f): f is File => f instanceof File && f.size > 0);
                setPosted(
                    `question: ${question.length} characters\n${question.slice(0, 160)}${question.length > 160 ? " …" : ""}\nscreenshots[]: ${files.length === 0 ? "none" : files.map((f) => `${f.name} (${f.size} bytes)`).join(", ")}`,
                );
            }}
        >
            <Input
                name="question"
                label="Question"
                placeholder="Paste a long passage or a screenshot…"
                pasteThreshold={200}
                pasteImages
                pasteFilesName="screenshots[]"
                previewChars={30}
            />
            <Button type="submit" size="sm" color="violet">Submit the form</Button>
            {posted !== null && (
                <pre className="whitespace-pre-wrap break-all rounded-md bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">{posted}</pre>
            )}
        </form>
    );
}
export const textareaDoc = componentDoc("Textarea", "is the controlled multi-line text primitive with optional auto-resize.", ["Textarea"]);
export const selectDoc = componentDoc("Select", "provides native and searchable listbox selection.", ["Select"]);
export const checkboxDoc = componentDoc("Checkbox", "represents one controlled boolean choice.", ["Checkbox & CheckboxGroup"]);
export const checkboxGroupDoc = componentDoc("CheckboxGroup", "manages a controlled set of boolean choices.", ["Checkbox & CheckboxGroup"]);
export const radioGroupDoc = componentDoc("RadioGroup", "manages one selected value from an accessible option group.", ["RadioGroup"]);
export const switchDoc = componentDoc("Switch", "is the controlled on/off toggle control.", ["Switch & MultiSwitch"]);
export const sliderDoc = componentDoc("Slider", "supports both single-value and two-thumb range selection.", ["Slider"]);
export const multiSwitchDoc = componentDoc("MultiSwitch", "is the segmented toggle for one value among several options.", ["Switch & MultiSwitch", "MultiSwitch colours"]);
export const datePickerDoc = componentDoc("DatePicker", "supports controlled single dates, date-times and date ranges.", ["DatePicker"]);
