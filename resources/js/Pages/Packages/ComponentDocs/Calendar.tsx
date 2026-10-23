import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Badge, Button, Calendar } from "@particle-academy/react-fancy";

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
        {
            name: "Per-day state and a controlled month",
            description:
                "renderDay draws a day's content and dayClassName shades it; the cell itself (button, click, selection) stays the Calendar's. dayAriaLabel gives a shaded day a name that says what the shade means. visibleMonth makes the shown month yours: the chevrons propose through onVisibleMonthChange, and you decide. Every day carries a stable id from dateId.",
            render: () => {
                function Bookings() {
                    const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
                    const [opened, setOpened] = useState<Date | null>(null);
                    // Odd days are booked, every fifth day is a draft: a real pattern, not noise.
                    const kind = (d: Date) => (d.getDate() % 5 === 0 ? "draft" : d.getDate() % 2 === 1 ? "booked" : null);

                    return (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
                                    This month
                                </Button>
                                {opened && <Badge color="sky">opened {opened.toDateString()}</Badge>}
                            </div>
                            <Calendar
                                value={opened}
                                onChange={(v) => setOpened(v as Date | null)}
                                visibleMonth={month}
                                onVisibleMonthChange={setMonth}
                                dateId={(d) => `day-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`}
                                renderDay={({ date, outsideMonth }) => (
                                    <span className="flex flex-col items-center leading-none">
                                        {date.getDate()}
                                        {!outsideMonth && kind(date) && (
                                            <span className={kind(date) === "booked" ? "mt-0.5 size-1 rounded-full bg-rose-500" : "mt-0.5 size-1 rounded-full bg-amber-500"} />
                                        )}
                                    </span>
                                )}
                                dayClassName={({ date, outsideMonth, selected }) =>
                                    !outsideMonth && !selected && kind(date) === "booked" ? "bg-rose-50 dark:bg-rose-950/40" : undefined
                                }
                                dayAriaLabel={({ date, outsideMonth }) =>
                                    !outsideMonth && kind(date) ? `${date.toDateString()}, ${kind(date)}` : undefined
                                }
                            />
                        </div>
                    );
                }

                return <Bookings />;
            },
            code: `const [month, setMonth] = useState(() => startOfMonth(new Date()));

<Calendar
    value={opened}
    onChange={setOpened}                       // opening a day = the normal click
    visibleMonth={month}                       // controlled; omit for uncontrolled
    onVisibleMonthChange={setMonth}            // called with the 1st of the month
    dateId={(d) => toIsoDate(d)}               // default: YYYY-MM-DD, local time
    renderDay={({ date }) => <DayWithDot date={date} />}
    dayClassName={({ date }) => (isBooked(date) ? "bg-rose-50" : undefined)}
    dayAriaLabel={({ date }) => (isBooked(date) ? \`\${date.toDateString()}, booked\` : undefined)}
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
        { name: "dateId", type: `(date: Date) => string`, default: "`YYYY-MM-DD` (local)", description: "Stable id per day, emitted as `data-react-fancy-calendar-day`." },
        { name: "renderDay", type: `(ctx: CalendarDayContext) => ReactNode`, default: "the day number", description: "A day's content. The cell (button, click, state classes) stays the Calendar's. `ctx` is `{ date, id, selected, disabled, inRange, outsideMonth, today }`." },
        { name: "dayClassName", type: `(ctx) => string | undefined`, default: "—", description: "Extra classes for one day, merged after the built-in ones." },
        { name: "dayAriaLabel", type: `(ctx) => string | undefined`, default: "—", description: "A day's accessible name. It replaces the default, so include the date. Give every shaded day one: colour alone does not reach a screen reader." },
        { name: "visibleMonth", type: `Date`, default: "—", description: "Controlled shown month (any day in it). Uncontrolled when omitted; starts at today." },
        { name: "onVisibleMonthChange", type: `(month: Date) => void`, default: "—", description: "Called with the 1st of the month navigated to, controlled or not." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>DateRange shape:</strong> <code>&#123; start: Date | null, end: Date | null &#125;</code>.
            Both are <code>null</code> initially; after the first click <code>start</code> is
            set and <code>end</code> stays <code>null</code> until the second click.
        </p>
    ),
};
