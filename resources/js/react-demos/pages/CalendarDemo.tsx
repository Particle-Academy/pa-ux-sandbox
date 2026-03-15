import { useState } from "react";
import { Calendar, type DateRange } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function CalendarDemo() {
  const [single, setSingle] = useState<Date | undefined>(undefined);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [multiple, setMultiple] = useState<Date[]>([]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Calendar</h1>

      <DemoSection title="Single Date" description="Select a single date." code={`<Calendar
  mode="single"
  value={date}
  onChange={(d) => setDate(d)}
/>`}>
        <div className="flex items-start gap-6">
          <Calendar
            mode="single"
            value={single}
            onChange={(d) => setSingle(d as Date)}
          />
          <p className="text-sm text-zinc-500">
            Selected: {single ? single.toLocaleDateString() : "none"}
          </p>
        </div>
      </DemoSection>

      <DemoSection title="Date Range" description="Select a start and end date." code={`<Calendar
  mode="range"
  value={range}
  onChange={(r) => setRange(r)}
/>`}>
        <div className="flex items-start gap-6">
          <Calendar
            mode="range"
            value={range}
            onChange={(r) => setRange(r as DateRange)}
          />
          <div className="text-sm text-zinc-500">
            <p>Start: {range.start?.toLocaleDateString() ?? "none"}</p>
            <p>End: {range.end?.toLocaleDateString() ?? "none"}</p>
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Multiple Dates" description="Select multiple individual dates." code={`<Calendar
  mode="multiple"
  value={dates}
  onChange={(d) => setDates(d)}
/>`}>
        <div className="flex items-start gap-6">
          <Calendar
            mode="multiple"
            value={multiple}
            onChange={(dates) => setMultiple(dates as Date[])}
          />
          <p className="text-sm text-zinc-500">
            {multiple.length} date(s) selected
          </p>
        </div>
      </DemoSection>
    </div>
  );
}
