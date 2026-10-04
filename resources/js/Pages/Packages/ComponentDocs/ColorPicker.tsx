import type { ComponentDoc } from "./types";
import { ColorPicker } from "@particle-academy/react-fancy";

const palette = ["#ef4444", "#f59e0b", "#22c55e", "#0ea5e9", "#8b5cf6", "#ec4899", "#71717a"];

export const colorPickerDoc: ComponentDoc = {
    intro: (
        <p>
            Hex color picker — opens a native color sampler plus an optional swatch row of
            presets. Two visual variants (<code>outline</code>, <code>filled</code>) and three sizes.
        </p>
    ),
    examples: [
        {
            name: "Default",
            render: () => (
                <div className="w-full max-w-xs">
                    <ColorPicker defaultValue="#8b5cf6" onChange={() => {}} />
                </div>
            ),
            code: `const [color, setColor] = useState("#8b5cf6");

<ColorPicker value={color} onChange={setColor} />`,
        },
        {
            name: "With presets",
            description: "A `presets` array shows a swatch row under the input.",
            render: () => (
                <div className="w-full max-w-xs">
                    <ColorPicker defaultValue="#0ea5e9" presets={palette} onChange={() => {}} />
                </div>
            ),
            code: `<ColorPicker
    value={color}
    onChange={setColor}
    presets={["#ef4444", "#f59e0b", "#22c55e", "#0ea5e9", "#8b5cf6"]}
/>`,
        },
        {
            name: "Sizes",
            description: "Three preset sizes.",
            render: () => (
                <div className="flex items-end gap-3">
                    <ColorPicker defaultValue="#8b5cf6" size="sm" />
                    <ColorPicker defaultValue="#8b5cf6" size="md" />
                    <ColorPicker defaultValue="#8b5cf6" size="lg" />
                </div>
            ),
            code: `<ColorPicker value={color} onChange={setColor} size="sm" />
<ColorPicker value={color} onChange={setColor} size="md" />
<ColorPicker value={color} onChange={setColor} size="lg" />`,
        },
        {
            name: "Variants",
            description: "outline (default) for forms, filled for canvas toolbars.",
            render: () => (
                <div className="flex items-center gap-3">
                    <ColorPicker defaultValue="#8b5cf6" variant="outline" />
                    <ColorPicker defaultValue="#8b5cf6" variant="filled" />
                </div>
            ),
            code: `<ColorPicker variant="outline" />
<ColorPicker variant="filled" />`,
        },
        {
            name: "Disabled",
            render: () => (
                <div className="w-full max-w-xs">
                    <ColorPicker defaultValue="#8b5cf6" disabled />
                </div>
            ),
            code: `<ColorPicker value={color} onChange={setColor} disabled />`,
        },
        {
            name: "mode — edit against view",
            description:
                "\"edit\" (the default) renders the control; \"view\" renders the value as plain text. One prop turns a form into its own read-only summary, so a detail page and its edit form are the same markup rather than two that drift. Inside a <Form> the mode comes from context, and an explicit prop here wins.",
            render: () => (
                <div className="grid w-full gap-4 sm:grid-cols-2">
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">mode="edit"</p>
                        <ColorPicker value="#7c3aed" mode="edit" />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">mode="view"</p>
                        <ColorPicker value="#7c3aed" mode="view" />
                    </div>
                </div>
            ),
            code: `{/* The same markup reads as a form or as a summary. */}
<ColorPicker value={value} onChange={setValue} mode={editing ? "edit" : "view"} />`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Controlled hex value (`\"#8b5cf6\"`). Use with `onChange`." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial hex value (uncontrolled)." },
        { name: "onChange", type: `(color: string) => void`, default: "—", description: "Called as the user picks a color." },
        { name: "presets", type: `string[]`, default: "—", description: "Hex strings shown as a swatch row below the input." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Visual size." },
        { name: "variant", type: `"outline" | "filled"`, default: `"outline"`, description: "Outline for forms, filled for canvas toolbars." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable the input." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "mode", type: `"edit" | "view"`, default: `"edit"`, description: "`edit` renders the control, `view` renders the value as text. Falls back to `<Form>` context." },
    ],
};
