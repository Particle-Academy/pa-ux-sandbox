import { useState } from "react";
import { TimePicker } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function TimePickerDemo() {
  const [time12, setTime12] = useState("09:30");
  const [time24, setTime24] = useState("14:45");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">TimePicker</h1>

      <DemoSection title="12-Hour Format" description="AM/PM time selection." code={`<TimePicker value={time} onChange={setTime} format="12h" />`}>
        <TimePicker value={time12} onChange={setTime12} format="12h" />
        <p className="mt-3 text-sm text-zinc-500">Value: {time12}</p>
      </DemoSection>

      <DemoSection title="24-Hour Format" description="Military time selection." code={`<TimePicker value={time} onChange={setTime} format="24h" />`}>
        <TimePicker value={time24} onChange={setTime24} format="24h" />
        <p className="mt-3 text-sm text-zinc-500">Value: {time24}</p>
      </DemoSection>

      <DemoSection title="Minute Steps" description="Increment minutes by 15." code={`<TimePicker defaultValue="10:00" format="12h" minuteStep={15} />`}>
        <TimePicker defaultValue="10:00" format="12h" minuteStep={15} />
      </DemoSection>

      <DemoSection title="Disabled" description="Non-interactive time picker." code={`<TimePicker value="08:00" format="12h" disabled />`}>
        <TimePicker value="08:00" format="12h" disabled />
      </DemoSection>
    </div>
  );
}
