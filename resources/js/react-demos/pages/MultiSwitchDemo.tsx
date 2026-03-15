import { useState } from "react";
import { MultiSwitch } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function MultiSwitchDemo() {
  const [view, setView] = useState("grid");
  const [plan, setPlan] = useState("monthly");
  const [level, setLevel] = useState("Off");

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-100">MultiSwitch</h1>
      <p className="mb-8 text-zinc-500">Button-group radio component for switching between options.</p>

      <DemoSection
        title="Basic"
        code={`<MultiSwitch
  list={["Grid", "List", "Table"]}
  value={view}
  onValueChange={setView}
/>`}
      >
        <div className="flex flex-col gap-4">
          <MultiSwitch
            list={["Grid", "List", "Table"]}
            value={view}
            onValueChange={setView}
          />
          <p className="text-sm text-zinc-500">Selected: {view}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="With Labels & Object Options"
        code={`<MultiSwitch
  label="Billing Period"
  list={[
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annual", label: "Annual" },
  ]}
  value={plan}
  onValueChange={setPlan}
/>`}
      >
        <MultiSwitch
          label="Billing Period"
          list={[
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "annual", label: "Annual" },
          ]}
          value={plan}
          onValueChange={setPlan}
        />
      </DemoSection>

      <DemoSection
        title="Sizes"
        code={`{(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
  <MultiSwitch size={s} list={["On", "Off", "Auto"]} defaultValue="On" />
))}`}
      >
        <div className="flex flex-col gap-4">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="w-8 text-xs font-mono text-zinc-400">{s}</span>
              <MultiSwitch size={s} list={["On", "Off", "Auto"]} defaultValue="On" />
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="States"
        code={`<MultiSwitch list={["A", "B", "C"]} defaultValue="A" dirty label="Dirty" />
<MultiSwitch list={["A", "B", "C"]} defaultValue="A" error="Required" label="Error" />
<MultiSwitch list={["A", "B", "C"]} defaultValue="A" disabled label="Disabled" />`}
      >
        <div className="flex flex-col gap-4">
          <MultiSwitch list={["A", "B", "C"]} defaultValue="A" dirty label="Dirty" />
          <MultiSwitch list={["A", "B", "C"]} defaultValue="A" error="Required" label="Error" />
          <MultiSwitch list={["A", "B", "C"]} defaultValue="A" disabled label="Disabled" />
        </div>
      </DemoSection>

      <DemoSection
        title="Linear Mode"
        description="Click any option to cycle to the next one in sequence."
        code={`<MultiSwitch
  linear
  list={["Off", "Low", "Medium", "High"]}
  value={level}
  onValueChange={setLevel}
/>`}
      >
        <div className="flex flex-col gap-4">
          <MultiSwitch
            linear
            list={["Off", "Low", "Medium", "High"]}
            value={level}
            onValueChange={setLevel}
          />
          <p className="text-sm text-zinc-500">Selected: {level}</p>
        </div>
      </DemoSection>
    </div>
  );
}
