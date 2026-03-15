import { useState } from "react";
import { Autocomplete } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
  { value: "peach", label: "Peach" },
  { value: "strawberry", label: "Strawberry" },
  { value: "watermelon", label: "Watermelon" },
];

const countries = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  { value: "br", label: "Brazil", disabled: true },
];

export function AutocompleteDemo() {
  const [fruit, setFruit] = useState("");
  const [country, setCountry] = useState("");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Autocomplete</h1>

      <DemoSection title="Basic" description="Type to filter and select from a list." code={`<Autocomplete
  options={[{ value: "apple", label: "Apple" }, ...]}
  value={fruit}
  onChange={setFruit}
  placeholder="Search fruits..."
/>`}>
        <div className="max-w-xs">
          <Autocomplete
            options={fruits}
            value={fruit}
            onChange={setFruit}
            placeholder="Search fruits..."
          />
          <p className="mt-2 text-sm text-zinc-500">Selected: {fruit || "none"}</p>
        </div>
      </DemoSection>

      <DemoSection title="With Disabled Options" description="Some options cannot be selected." code={`<Autocomplete
  options={[
    { value: "us", label: "United States" },
    { value: "br", label: "Brazil", disabled: true },
  ]}
  value={country}
  onChange={setCountry}
  emptyMessage="No countries found."
/>`}>
        <div className="max-w-xs">
          <Autocomplete
            options={countries}
            value={country}
            onChange={setCountry}
            placeholder="Search countries..."
            emptyMessage="No countries found."
          />
          <p className="mt-2 text-sm text-zinc-500">Selected: {country || "none"}</p>
        </div>
      </DemoSection>
    </div>
  );
}
