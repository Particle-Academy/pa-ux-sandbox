import { useState } from "react";
import { RadioGroup } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const plans = [
  { value: "free", label: "Free", description: "Basic features" },
  { value: "pro", label: "Pro", description: "Advanced features + support" },
  { value: "enterprise", label: "Enterprise", description: "Custom solutions" },
];

const sizes = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export function RadioGroupDemo() {
  const [plan, setPlan] = useState("pro");

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">RadioGroup</h1>

      <DemoSection title="Basic" description="Single-select radio group.">
        <RadioGroup label="Plan" list={plans} value={plan} onValueChange={setPlan} />
        <p className="mt-2 text-sm text-zinc-500">Selected: {plan}</p>
      </DemoSection>

      <DemoSection title="Horizontal" description="Horizontal radio layout.">
        <RadioGroup label="Size" list={sizes} defaultValue="md" orientation="horizontal" />
      </DemoSection>

      <DemoSection title="States" description="Error, dirty, disabled.">
        <div className="flex flex-col gap-4">
          <RadioGroup label="Error" list={sizes} error="Please select a size" />
          <RadioGroup label="Disabled" list={sizes} disabled defaultValue="sm" />
        </div>
      </DemoSection>
    </div>
  );
}
