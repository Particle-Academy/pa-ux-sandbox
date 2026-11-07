import type { ComponentDoc } from "./types";
import { OtpInput, Text } from "@particle-academy/react-fancy";

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
            name: "Accessible names: label, aria-labelledby, labels",
            description:
                "The cells sit in one `role=\"group\"`. `label` names it (default \"Verification code\"); `aria-labelledby` points at a visible heading instead and wins over `label`. `labels.digit` names each cell, with `{n}` for its position and `{total}` for the length; the default is \"Digit {n} of {total}\", so translate it here.",
            render: () => (
                <div className="grid w-full gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Text size="xs" className="font-medium">label="Sign-in code"</Text>
                        <OtpInput length={6} label="Sign-in code" onChange={() => {}} />
                    </div>
                    <div className="space-y-1">
                        <Text id="otp-docs-heading" size="xs" className="font-medium">
                            Código de verificación
                        </Text>
                        <OtpInput
                            length={6}
                            aria-labelledby="otp-docs-heading"
                            labels={{ digit: "Dígito {n} de {total}" }}
                            onChange={() => {}}
                        />
                    </div>
                </div>
            ),
            code: `{/* A name for the group when there is no visible heading. */}
<OtpInput label="Sign-in code" value={code} onChange={setCode} />

{/* A visible heading names it instead, and each cell is translated. */}
<p id="otp-heading">Código de verificación</p>
<OtpInput
    aria-labelledby="otp-heading"
    labels={{ digit: "Dígito {n} de {total}" }}
    value={code}
    onChange={setCode}
/>`,
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
        { name: "label", type: `string`, default: `"Verification code"`, description: "Accessible name of the group of cells. Ignored when `aria-labelledby` is given." },
        { name: "aria-labelledby", type: `string`, default: "—", description: "Id of a visible element naming the group; wins over `label`." },
        { name: "labels", type: `{ digit?: string }`, default: `{ digit: "Digit {n} of {total}" }`, description: "Each cell's accessible name, for translation. `{n}` is its position, `{total}` the code length." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Paste behavior:</strong> pasting a full code into any cell distributes it
            across all cells. Backspace moves focus to the previous cell on an empty cell.
            <br />
            <strong>SMS autofill:</strong> the first cell carries{" "}
            <code>autocomplete="one-time-code"</code>, so iOS and Android offer the code from
            a text message; the other cells are <code>autocomplete="off"</code>. When several
            digits land in one cell at once (autofill, an IME, a routed paste) they are spread
            across the cells from that one, and focus moves to the next empty cell.
        </p>
    ),
};
