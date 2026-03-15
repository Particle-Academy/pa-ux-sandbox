import { useState } from "react";
import { Select } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "dragonfruit", label: "Dragonfruit" },
];

const grouped = [
  {
    label: "Fruits",
    options: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
    ],
  },
  {
    label: "Vegetables",
    options: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
    ],
  },
];

export function SelectDemo() {
  const [val, setVal] = useState("");
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Select</h1>

      <DemoSection title="Basic" description="Simple select dropdown.">
        <Select label="Fruit" list={fruits} placeholder="Choose a fruit" />
      </DemoSection>

      <DemoSection title="Option Groups" description="Grouped options with optgroup.">
        <Select label="Food" list={grouped} placeholder="Pick one" />
      </DemoSection>

      <DemoSection title="States" description="Error, dirty, disabled.">
        <div className="flex flex-col gap-3">
          <Select label="Error" list={fruits} error="Please select a value" />
          <Select label="Dirty" list={fruits} dirty defaultValue="banana" />
          <Select label="Disabled" list={fruits} disabled defaultValue="cherry" />
        </div>
      </DemoSection>

      <DemoSection title="Controlled" description="Controlled select.">
        <Select label="Controlled" list={fruits} value={val} onValueChange={setVal} placeholder="Choose..." />
        <p className="mt-2 text-sm text-zinc-500">Selected: {val || "(none)"}</p>
      </DemoSection>
    </div>
  );
}
