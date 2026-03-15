import { DatePicker } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function DatePickerDemo() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">DatePicker</h1>

      <DemoSection title="Basic" description="Single date picker.">
        <DatePicker label="Date" />
      </DemoSection>

      <DemoSection title="With Time" description="Date and time picker.">
        <DatePicker label="Date & Time" includeTime />
      </DemoSection>

      <DemoSection title="Date Range" description="Start and end date selection.">
        <DatePicker label="Date Range" range />
      </DemoSection>

      <DemoSection title="With Constraints" description="Min and max date limits.">
        <DatePicker label="Booking" min="2024-01-01" max="2024-12-31" />
      </DemoSection>

      <DemoSection title="States" description="Error, dirty, disabled.">
        <div className="flex flex-col gap-3">
          <DatePicker label="Error" error="Date is required" />
          <DatePicker label="Dirty" dirty defaultValue="2024-06-15" />
          <DatePicker label="Disabled" disabled defaultValue="2024-03-01" />
        </div>
      </DemoSection>
    </div>
  );
}
