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

const roles = [
  { value: "admin", label: "Administrator", description: "Full access to all resources" },
  { value: "editor", label: "Editor", description: "Can edit and publish content" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
  { value: "billing", label: "Billing Manager", description: "Manage subscriptions and invoices" },
  { value: "support", label: "Support Agent", description: "Respond to customer tickets" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];

const initialTags = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "design", label: "Design" },
];

export function SelectDemo() {
  const [val, setVal] = useState("");
  const [multi, setMulti] = useState<string[]>(["editor", "viewer"]);
  const [langs, setLangs] = useState<string[]>([]);
  const [tag, setTag] = useState<string>("");
  const [tags, setTags] = useState<string[]>(["frontend"]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Select</h1>

      {/* ── Native variant ─────────────────────────────── */}

      <DemoSection title="Basic (Native)" description="Simple select dropdown using native HTML element.">
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

      <DemoSection title="Controlled" description="Controlled native select.">
        <Select label="Controlled" list={fruits} value={val} onValueChange={setVal} placeholder="Choose..." />
        <p className="mt-2 text-sm text-zinc-500">Selected: {val || "(none)"}</p>
      </DemoSection>

      {/* ── Listbox variant ────────────────────────────── */}

      <DemoSection title="Listbox (Single)" description="Custom dropdown with checkmark indicator." code={`<Select variant="listbox" list={roles} placeholder="Assign role..." />`}>
        <Select variant="listbox" label="Role" list={roles} placeholder="Assign role..." />
      </DemoSection>

      <DemoSection title="Multi-Select" description="Select multiple items. Shows count when more than one selected." code={`<Select multiple list={roles} values={multi} onValuesChange={setMulti} />`}>
        <Select
          multiple
          label="Roles"
          list={roles}
          values={multi}
          onValuesChange={setMulti}
          placeholder="Assign roles..."
        />
        <p className="mt-2 text-sm text-zinc-500">
          Selected: {multi.length > 0 ? multi.join(", ") : "(none)"}
        </p>
      </DemoSection>

      <DemoSection title="Multi-Select with Checkboxes" description="Checkbox indicator style instead of checkmarks." code={`<Select multiple indicator="checkbox" list={roles} />`}>
        <Select
          multiple
          indicator="checkbox"
          label="Permissions"
          list={roles}
          placeholder="Select permissions..."
        />
      </DemoSection>

      <DemoSection title="Searchable Multi-Select" description="Filter options by typing. Great for long lists." code={`<Select multiple searchable list={languages} />`}>
        <Select
          multiple
          searchable
          label="Languages"
          list={languages}
          values={langs}
          onValuesChange={setLangs}
          placeholder="Choose languages..."
          selectedSuffix="languages"
        />
        <p className="mt-2 text-sm text-zinc-500">
          Selected: {langs.length > 0 ? langs.join(", ") : "(none)"}
        </p>
      </DemoSection>

      <DemoSection title="Creatable (Single)" description="Type to add a new value when none of the existing options match. Press Enter or click the Create row." code={`<Select variant="listbox" creatable list={initialTags} value={tag} onValueChange={setTag} />`}>
        <Select
          variant="listbox"
          creatable
          label="Category"
          list={initialTags}
          value={tag}
          onValueChange={setTag}
          placeholder="Pick or add a category..."
        />
        <p className="mt-2 text-sm text-zinc-500">Selected: {tag || "(none)"}</p>
      </DemoSection>

      <DemoSection title="Creatable Multi-Select" description="Tag-input pattern: pick from existing options or add new tags inline." code={`<Select multiple creatable list={initialTags} values={tags} onValuesChange={setTags} />`}>
        <Select
          multiple
          creatable
          label="Tags"
          list={initialTags}
          values={tags}
          onValuesChange={setTags}
          placeholder="Add tags..."
          selectedSuffix="tags"
        />
        <p className="mt-2 text-sm text-zinc-500">Selected: {tags.length > 0 ? tags.join(", ") : "(none)"}</p>
      </DemoSection>

      <DemoSection title="Listbox States" description="Error, dirty, and disabled states on listbox variant.">
        <div className="flex flex-col gap-3">
          <Select variant="listbox" label="Error" list={fruits} error="Please select a value" placeholder="Choose..." />
          <Select variant="listbox" label="Dirty" list={fruits} dirty defaultValue="banana" />
          <Select variant="listbox" label="Disabled" list={fruits} disabled placeholder="Choose..." />
        </div>
      </DemoSection>
    </div>
  );
}
