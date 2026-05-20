import type { ComponentDoc } from "./types";
import { Calendar } from "@particle-academy/react-fancy";

const today = new Date();
const inThreeDays = new Date(today);
inThreeDays.setDate(today.getDate() + 3);
const inSevenDays = new Date(today);
inSevenDays.setDate(today.getDate() + 7);

export const calendarDoc: ComponentDoc = {
    intro: (
        <p>
            Month-grid date picker with three selection modes — single date, date range, or
            multiple discrete dates. Returns native <code>Date</code> objects. Cap selectable
            days with <code>minDate</code> / <code>maxDate</code>.
        </p>
    ),
    examples: [
        {
            name: "Single date (default)",
            render: () => (
                <Calendar value={today} onChange={() => {}} />
            ),
            code: `const [date, setDate] = useState<Date | null>(new Date());

<Calendar value={date} onChange={setDate} />`,
        },
        {
            name: "Range",
            description: "Two clicks select start + end. Returns `{ start, end }`.",
            render: () => (
                <Calendar mode="range" value={{ start: today, end: inSevenDays }} onChange={() => {}} />
            ),
            code: `const [range, setRange] = useState<DateRange>({ start: null, end: null });

<Calendar mode="range" value={range} onChange={setRange} />`,
        },
        {
            name: "Multiple",
            description: "Click any cell to toggle it in the selection. Returns `Date[]`.",
            render: () => (
                <Calendar mode="multiple" value={[today, inThreeDays, inSevenDays]} onChange={() => {}} />
            ),
            code: `const [dates, setDates] = useState<Date[]>([]);

<Calendar mode="multiple" value={dates} onChange={setDates} />`,
        },
        {
            name: "Min / max",
            description: "Constrain to a window — past dates or far-future dates become unselectable.",
            render: () => (
                <Calendar value={today} minDate={today} maxDate={inSevenDays} onChange={() => {}} />
            ),
            code: `<Calendar
    value={date}
    onChange={setDate}
    minDate={today}
    maxDate={inOneWeek}
/>`,
        },
    ],
    props: [
        { name: "mode", type: `"single" | "range" | "multiple"`, default: `"single"`, description: "Selection mode." },
        { name: "value", type: `Date | Date[] | DateRange | null`, default: "—", description: "Controlled selection. Shape matches the active `mode`." },
        { name: "onChange", type: `(value) => void`, default: "—", description: "Called whenever the selection changes." },
        { name: "minDate", type: `Date`, default: "—", description: "Earliest selectable date (inclusive)." },
        { name: "maxDate", type: `Date`, default: "—", description: "Latest selectable date (inclusive)." },
        { name: "disabledDates", type: `Date[]`, default: "—", description: "Specific dates to disable (e.g. holidays, blackout days)." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>DateRange shape:</strong> <code>&#123; start: Date | null, end: Date | null &#125;</code>.
            Both are <code>null</code> initially; after the first click <code>start</code> is
            set and <code>end</code> stays <code>null</code> until the second click.
        </p>
    ),
};
