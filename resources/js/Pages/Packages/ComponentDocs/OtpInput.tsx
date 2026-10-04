import type { ComponentDoc } from "./types";
import { OtpInput } from "@particle-academy/react-fancy";

export const otpInputDoc: ComponentDoc = {
    intro: (
        <p>
            Segmented input for one-time codes, MFA, PINs. Defaults to 6 cells. Auto-advances
            on type, backspaces to the previous cell, and accepts paste of the whole code into
            the first cell.
        </p>
    ),
    examples: [
        {
            name: "Default (6 cells)",
            render: () => <OtpInput onChange={() => {}} />,
            code: `const [code, setCode] = useState("");

<OtpInput value={code} onChange={setCode} />`,
        },
        {
            name: "Custom length",
            description: "Set `length` for shorter PINs or longer codes.",
            render: () => (
                <div className="space-y-3">
                    <OtpInput length={4} onChange={() => {}} />
                    <OtpInput length={8} onChange={() => {}} />
                </div>
            ),
            code: `<OtpInput length={4} onChange={setCode} />
<OtpInput length={8} onChange={setCode} />`,
        },
        {
            name: "Controlled value",
            description: "Bind `value` + `onChange` and pre-fill the cells.",
            render: () => <OtpInput value="123456" onChange={() => {}} />,
            code: `const [code, setCode] = useState("123456");

<OtpInput value={code} onChange={setCode} />`,
        },
        {
            name: "Auto-focus",
            description: "Focus the first cell on mount — the standard MFA UX.",
            render: () => <OtpInput onChange={() => {}} autoFocus />,
            code: `<OtpInput onChange={setCode} autoFocus />`,
        },
        {
            name: "Disabled",
            render: () => <OtpInput value="654321" onChange={() => {}} disabled />,
            code: `<OtpInput value={code} onChange={setCode} disabled />`,
        },
        {
            name: "mode — edit against view",
            description:
                "\"edit\" (the default) renders the control; \"view\" renders the value as plain text. One prop turns a form into its own read-only summary, so a detail page and its edit form are the same markup rather than two that drift. Inside a <Form> the mode comes from context, and an explicit prop here wins.",
            render: () => (
                <div className="grid w-full gap-4 sm:grid-cols-2">
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">mode="edit"</p>
                        <OtpInput value="4821" length={4} mode="edit" />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">mode="view"</p>
                        <OtpInput value="4821" length={4} mode="view" />
                    </div>
                </div>
            ),
            code: `{/* The same markup reads as a form or as a summary. */}
<OtpInput value={value} onChange={setValue} mode={editing ? "edit" : "view"} />`,
        },
    ],
    props: [
        { name: "length", type: `number`, default: `6`, description: "Number of cells in the input." },
        { name: "value", type: `string`, default: "—", description: "Controlled value (each character occupies one cell)." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called as cells are filled / cleared." },
        { name: "autoFocus", type: `boolean`, default: `false`, description: "Focus the first cell on mount." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable all cells." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the cells container." },
        { name: "mode", type: `"edit" | "view"`, default: `"edit"`, description: "`edit` renders the control, `view` renders the value as text. Falls back to `<Form>` context." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Paste behavior:</strong> pasting a full code into any cell distributes it
            across all cells. Backspace moves focus to the previous cell on an empty cell.
        </p>
    ),
};
