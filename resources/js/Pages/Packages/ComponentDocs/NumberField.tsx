import { useState, type MouseEvent } from "react";
import type { ComponentDoc } from "./types";
import { Button, Form, NumberField, Text } from "@particle-academy/react-fancy";

function Readout({ value }: { value: unknown }) {
    return (
        <Text size="xs" className="font-mono !text-zinc-500" data-demo="number-field-value">
            value: {JSON.stringify(value)}
        </Text>
    );
}

function BlankExample() {
    const [value, setValue] = useState<number | null>(null);
    return (
        <div className="w-full max-w-xs space-y-2" data-demo="number-field-blank">
            <NumberField label="Quantity" value={value} onValueChange={setValue} />
            <Readout value={value} />
        </div>
    );
}

function PartialExample() {
    const [value, setValue] = useState<number | null>(12);
    return (
        <div className="w-full max-w-xs space-y-2" data-demo="number-field-partial">
            <NumberField label="Score" value={value} onValueChange={setValue} placeholder="Try -, 1e, 0x10 or 1,000" />
            <Readout value={value} />
        </div>
    );
}

function RangeExample() {
    const [value, setValue] = useState<number | null>(50);
    return (
        <div className="w-full max-w-xs space-y-2" data-demo="number-field-range">
            <NumberField
                label="Volume"
                description="0 to 100, in steps of 5"
                value={value}
                onValueChange={setValue}
                min={0}
                max={100}
                step={5}
            />
            <Readout value={value} />
        </div>
    );
}

function UnitsExample() {
    const [weight, setWeight] = useState<number | null>(2.5);
    const [temperature, setTemperature] = useState<number | null>(-4);
    return (
        <div className="grid w-full max-w-md gap-3 sm:grid-cols-2" data-demo="number-field-units">
            <NumberField label="Weight" value={weight} onValueChange={setWeight} min={0} step={0.1} suffix="kg" />
            <NumberField label="Temperature" value={temperature} onValueChange={setTemperature} min={-40} max={60} suffix="C" />
        </div>
    );
}

function FormExample() {
    const [quantity, setQuantity] = useState<number | null>(0);
    const [check, setCheck] = useState("not checked yet");
    return (
        <Form className="w-full max-w-xs space-y-2" data-demo="number-field-form" onSubmit={(e) => e.preventDefault()}>
            <NumberField name="quantity" label="Quantity" value={quantity} onValueChange={setQuantity} min={1} step={1} required />
            <Button
                type="button"
                size="sm"
                onClick={(e: MouseEvent<HTMLButtonElement>) => setCheck(e.currentTarget.form?.reportValidity() ? "valid" : "invalid")}
            >
                Check the form
            </Button>
            <Text size="xs" className="font-mono !text-zinc-500" data-demo="number-field-form-check">
                checkValidity: {check}
            </Text>
        </Form>
    );
}

function ExternalWriteExample() {
    const [value, setValue] = useState<number | null>(7);
    return (
        <div className="w-full max-w-xs space-y-2" data-demo="number-field-external">
            <NumberField label="Seats" value={value} onValueChange={setValue} min={0} step={1} />
            <div className="flex gap-2">
                <Button size="sm" onClick={() => setValue(42)}>Write 42</Button>
                <Button size="sm" onClick={() => setValue(null)}>Write null</Button>
            </div>
            <Readout value={value} />
        </div>
    );
}

function ViewModeExample() {
    const [value, setValue] = useState<number | null>(128);
    return (
        <div className="w-full max-w-xs space-y-2" data-demo="number-field-view">
            <NumberField label="Budget" mode="view" value={value} onValueChange={setValue} min={0} suffix="USD" />
            <Readout value={value} />
        </div>
    );
}

export const numberFieldDoc: ComponentDoc = {
    intro: (
        <Text>
            A controlled numeric field whose value is a <code>number</code> or <code>null</code>. Blank is{" "}
            <code>null</code>, never <code>0</code>; half-typed text never emits a wrong number; and the mouse wheel
            does not change it. Reach for it over <code>{`<Input type="number">`}</code> when the value is a number
            rather than a string, or when &ldquo;no value&rdquo; must stay different from zero: a temperature, a
            quantity, a price, a score.
        </Text>
    ),
    examples: [
        {
            name: "Blank is null",
            description: "Clear the field and `onValueChange` receives `null`, not `0`. It is called only when the value actually changes.",
            render: () => <BlankExample />,
            code: `const [value, setValue] = useState<number | null>(null);

<NumberField label="Quantity" value={value} onValueChange={setValue} />`,
        },
        {
            name: "Partial text never emits a wrong number",
            description: "`-`, `.` and `1e` are not numbers yet, so the value is `null` while the text stays on screen. `0x10`, `Infinity` and `1,000` are never read as numbers: decimal notation only. `1.` emits `1` and becomes `1` on blur. When focus leaves, the text is replaced with what the value is.",
            render: () => <PartialExample />,
            code: `<NumberField label="Score" value={value} onValueChange={setValue} />`,
        },
        {
            name: "Range and step",
            description: "The arrow keys move by `step` on a grid counted from `min` and stop at `min` and `max`. A typed value outside them is emitted and reported as invalid, not rewritten: `5` may be on its way to `50`.",
            render: () => <RangeExample />,
            code: `<NumberField
    label="Volume"
    value={value}
    onValueChange={setValue}
    min={0}
    max={100}
    step={5}
/>`,
        },
        {
            name: "Units and negative values",
            description: "A unit goes through the same `suffix` prop as `Input`. The keypad offered on a phone follows `min` and `step`: only a field that cannot be negative gets one without a minus sign.",
            render: () => <UnitsExample />,
            code: `<NumberField label="Weight" value={weight} onValueChange={setWeight} min={0} step={0.1} suffix="kg" />
<NumberField label="Temperature" value={temperature} onValueChange={setTemperature} min={-40} max={60} suffix="C" />`,
        },
        {
            name: "In a form",
            description: "`name` posts the number through a hidden input, not the text on screen. `min`, `max` and a declared `step` are reported through `setCustomValidity`, so `form.checkValidity()` and the browser's submit blocking behave as they do on a number input.",
            render: () => <FormExample />,
            code: `<Form action="/order" method="post">
    <NumberField name="quantity" label="Quantity" value={quantity} onValueChange={setQuantity} min={1} step={1} required />
</Form>`,
        },
        {
            name: "Written from outside",
            description: "The field is controlled, so an agent or a parent writes `value` like anything else. A write does not go through the text, so partial input does not apply to it.",
            render: () => <ExternalWriteExample />,
            code: `<NumberField label="Seats" value={value} onValueChange={setValue} min={0} step={1} />
<Button onClick={() => setValue(42)}>Write 42</Button>
<Button onClick={() => setValue(null)}>Write null</Button>`,
        },
        {
            name: "View mode",
            description: "`mode=\"view\"`, or a surrounding `<Form mode=\"view\">`, shows the value as text and becomes editable when clicked.",
            render: () => <ViewModeExample />,
            code: `<NumberField label="Budget" mode="view" value={value} onValueChange={setValue} min={0} suffix="USD" />`,
        },
    ],
    props: [
        { name: "value", type: `number | null`, default: "—", description: "The number, or `null` for none. A `NaN` or `Infinity` shows as blank." },
        { name: "defaultValue", type: `number | null`, default: `null`, description: "Starting value when uncontrolled." },
        { name: "onValueChange", type: `(value: number | null) => void`, default: "—", description: "Called when the value changes, with `null` for blank or unreadable text." },
        { name: "min", type: `number`, default: "—", description: "Lowest valid value. The arrow keys stop here." },
        { name: "max", type: `number`, default: "—", description: "Highest valid value. The arrow keys stop here." },
        { name: "step", type: `number | "any"`, default: "—", description: "What the arrow keys move by, on a grid counted from `min` (or 0). Declaring a number also makes off-grid values invalid. Omitted or `\"any\"`, the arrows move by 1 and any number is valid." },
        { name: "name", type: `string`, default: "—", description: "Posts the number through a hidden input, not the text on screen. Blank posts an empty string." },
        { name: "suffix / prefix", type: `ReactNode`, default: "—", description: "Affixes, for a unit." },
        { name: "suffixPosition / prefixPosition", type: `"inside" | "outside"`, default: "—", description: "Where the affix renders." },
        { name: "leading / trailing", type: `ReactNode`, default: "—", description: "Icon or element inside the field." },
        { name: "messages", type: `{ invalid?, min?, max?, step? }`, default: "English", description: "Validation messages, for a host working in another language." },
        { name: "mode", type: `"edit" | "view"`, default: `"edit"`, description: "`\"view\"` shows the value as text, with click-to-edit." },
        { name: "label, description, error, required, dirty, disabled, size", type: "—", default: "—", description: "As on `Input`." },
    ],
    notes: (
        <Text size="xs">
            Handles: <code>[data-react-fancy-number-field]</code> marks the field in both edit and view mode, and{" "}
            <code>role=&quot;spinbutton&quot;</code> carries <code>aria-valuenow</code> (absent when blank),{" "}
            <code>aria-valuemin</code> and <code>aria-valuemax</code>. The default <code>step</code> differs from{" "}
            <code>{`<input type="number">`}</code> on one point: undeclared, a native field rejects <code>1.5</code>{" "}
            and this one accepts it. Import from the barrel or the <code>./number-field</code> subpath.
        </Text>
    ),
};
