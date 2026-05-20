import type { ComponentDoc } from "./types";
import { TimePicker } from "@particle-academy/react-fancy";

export const timePickerDoc: ComponentDoc = {
    intro: (
        <p>
            Time-of-day input. Returns an <code>HH:mm</code> string. Supports 12- and 24-hour
            formats and a configurable minute step (5-, 10-, 15-min increments are common).
        </p>
    ),
    examples: [
        {
            name: "Default (24h)",
            render: () => (
                <div className="w-full max-w-xs">
                    <TimePicker defaultValue="09:30" onChange={() => {}} />
                </div>
            ),
            code: `const [time, setTime] = useState("09:30");

<TimePicker value={time} onChange={setTime} />`,
        },
        {
            name: "12-hour format",
            description: "Display + cycle through 12-hour with AM/PM. `value` stays 24h internally.",
            render: () => (
                <div className="w-full max-w-xs">
                    <TimePicker defaultValue="14:15" format="12h" onChange={() => {}} />
                </div>
            ),
            code: `<TimePicker value={time} onChange={setTime} format="12h" />`,
        },
        {
            name: "Minute step",
            description: "Constrain minutes to a step — useful for scheduling (15-min slots, 30-min meetings).",
            render: () => (
                <div className="w-full max-w-xs space-y-2">
                    <TimePicker defaultValue="09:00" minuteStep={15} onChange={() => {}} />
                    <TimePicker defaultValue="09:00" minuteStep={30} onChange={() => {}} />
                </div>
            ),
            code: `<TimePicker value={time} onChange={setTime} minuteStep={15} />
<TimePicker value={time} onChange={setTime} minuteStep={30} />`,
        },
        {
            name: "Disabled",
            render: () => (
                <div className="w-full max-w-xs">
                    <TimePicker defaultValue="12:00" disabled onChange={() => {}} />
                </div>
            ),
            code: `<TimePicker value={time} onChange={setTime} disabled />`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Controlled `HH:mm` string (24-hour, even when `format=\"12h\"`)." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial value (uncontrolled)." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called as the user changes hours / minutes." },
        { name: "format", type: `"12h" | "24h"`, default: `"24h"`, description: "Display format. The emitted `value` stays 24h." },
        { name: "minuteStep", type: `number`, default: `1`, description: "Minute increment — set to 15 / 30 for scheduling UIs." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable the input." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
};
