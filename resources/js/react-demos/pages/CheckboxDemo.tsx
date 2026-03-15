import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const options = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
];

export function CheckboxDemo() {
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string[]>(["react"]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Checkbox</h1>

      <DemoSection title="Single Checkbox" description="Basic checkbox with label.">
        <Checkbox label="Accept terms and conditions" checked={checked} onCheckedChange={setChecked} />
        <p className="mt-2 text-sm text-zinc-500">Checked: {String(checked)}</p>
      </DemoSection>

      <DemoSection title="Indeterminate" description="Checkbox with indeterminate state.">
        <Checkbox label="Select all" indeterminate />
      </DemoSection>

      <DemoSection title="States" description="Error, dirty, disabled.">
        <div className="flex flex-col gap-3">
          <Checkbox label="Error state" error="Required" />
          <Checkbox label="Dirty state" dirty defaultChecked />
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled checked" disabled defaultChecked />
        </div>
      </DemoSection>

      <DemoSection title="Checkbox Group" description="Multi-select group with vertical layout.">
        <CheckboxGroup label="Frameworks" list={options} value={selected} onValueChange={setSelected} />
        <p className="mt-2 text-sm text-zinc-500">Selected: {selected.join(", ") || "(none)"}</p>
      </DemoSection>

      <DemoSection title="Horizontal Group" description="Horizontal checkbox group.">
        <CheckboxGroup label="Frameworks" list={options} defaultValue={["vue"]} orientation="horizontal" />
      </DemoSection>
    </div>
  );
}
