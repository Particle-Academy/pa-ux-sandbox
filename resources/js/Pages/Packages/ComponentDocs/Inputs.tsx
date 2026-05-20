import type { ComponentDoc } from "./types";
import { Checkbox, CheckboxGroup, Field, Input, MultiSwitch, RadioGroup, Select, Slider, Switch, Textarea } from "@particle-academy/react-fancy";

export const inputsDoc: ComponentDoc = {
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
                    <Input label="Username" error="That username is taken." defaultValue="glenn" required />
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
            name: "Field (custom input shell)",
            description: "Use `Field` directly when you have a custom input that needs the same label + description + error treatment.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Field label="Color" description="Hex value">
                        <input type="color" defaultValue="#8b5cf6" className="h-9 w-full rounded-md border border-zinc-300" />
                    </Field>
                </div>
            ),
            code: `<Field label="Color" description="Hex value" htmlFor="color-input">
    <input id="color-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
</Field>`,
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
