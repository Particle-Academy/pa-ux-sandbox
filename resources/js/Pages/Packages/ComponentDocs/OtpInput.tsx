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
    ],
    props: [
        { name: "length", type: `number`, default: `6`, description: "Number of cells in the input." },
        { name: "value", type: `string`, default: "—", description: "Controlled value (each character occupies one cell)." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called as cells are filled / cleared." },
        { name: "autoFocus", type: `boolean`, default: `false`, description: "Focus the first cell on mount." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable all cells." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the cells container." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Paste behavior:</strong> pasting a full code into any cell distributes it
            across all cells. Backspace moves focus to the previous cell on an empty cell.
        </p>
    ),
};
