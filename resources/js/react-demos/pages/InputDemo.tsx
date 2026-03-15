import { useState } from "react";
import { Input } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function InputDemo() {
  const [val, setVal] = useState("");
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Input</h1>

      <DemoSection title="Basic" description="Standard text input with label.">
        <Input label="Name" placeholder="Enter your name" />
      </DemoSection>

      <DemoSection title="With Leading & Trailing" description="Input with icon slots.">
        <Input label="Email" type="email" placeholder="you@example.com" leading={<span>@</span>} />
      </DemoSection>

      <DemoSection title="Sizes" description="All available sizes.">
        <div className="flex flex-col gap-3">
          <Input size="xs" placeholder="Extra small" />
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium (default)" />
          <Input size="lg" placeholder="Large" />
          <Input size="xl" placeholder="Extra large" />
        </div>
      </DemoSection>

      <DemoSection title="States" description="Error, dirty, and disabled states.">
        <div className="flex flex-col gap-3">
          <Input label="With error" error="This field is required" placeholder="Error state" />
          <Input label="Dirty" dirty placeholder="Modified value" defaultValue="changed" />
          <Input label="Disabled" disabled placeholder="Cannot edit" />
        </div>
      </DemoSection>

      <DemoSection title="Controlled" description="Controlled input with onValueChange.">
        <Input label="Controlled" value={val} onValueChange={setVal} placeholder="Type here..." />
        <p className="mt-2 text-sm text-zinc-500">Value: {val || "(empty)"}</p>
      </DemoSection>
    </div>
  );
}
