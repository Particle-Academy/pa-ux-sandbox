import { useState } from "react";
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Switch,
  Slider,
  DatePicker,
  Field,
} from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function InputsDemo() {
  const [dirty, setDirty] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [selectValue, setSelectValue] = useState("react");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [checkboxGroupValue, setCheckboxGroupValue] = useState<string[]>(["typescript"]);
  const [radioValue, setRadioValue] = useState("monthly");
  const [switchChecked, setSwitchChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [rangeSliderValue, setRangeSliderValue] = useState<[number, number]>([20, 80]);
  const [dateValue, setDateValue] = useState("");
  const [dateRangeValue, setDateRangeValue] = useState<[string, string]>(["", ""]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Inputs</h1>

      {/* Dirty toggle */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
        <Switch
          checked={dirty}
          onCheckedChange={setDirty}
          color="amber"
          label="Toggle dirty state on all inputs below"
          size="sm"
        />
      </div>

      <DemoSection title="Input" description="Text-like inputs with type variants, leading/trailing slots." code={`<Input label="Full name" placeholder="John Doe" value={value} onValueChange={setValue} />
<Input label="Email" type="email" placeholder="john@example.com" />
<Input label="Password" type="password" placeholder="••••••••" />
<Input label="Search" type="search" placeholder="Search..." leading={<SearchIcon />} />`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            placeholder="John Doe"
            dirty={dirty}
            value={textValue}
            onValueChange={setTextValue}
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            dirty={dirty}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            dirty={dirty}
          />
          <Input
            label="Search"
            type="search"
            placeholder="Search..."
            dirty={dirty}
            leading={<SearchIcon />}
          />
        </div>
      </DemoSection>

      <DemoSection title="Input — Error State" description="Inputs with validation errors." code={`<Input label="Email" type="email" value="not-an-email" error="Please enter a valid email address" />
<Input label="Username" value="ab" error="Username must be at least 3 characters" required />`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            value="not-an-email"
            error="Please enter a valid email address"
          />
          <Input
            label="Username"
            value="ab"
            error="Username must be at least 3 characters"
            required
          />
        </div>
      </DemoSection>

      <DemoSection title="Input — Sizes" description="Inputs in all size variants." code={`<Input size="xs" placeholder="Extra small" />
<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium (default)" />
<Input size="lg" placeholder="Large" />
<Input size="xl" placeholder="Extra large" />`}>
        <div className="flex flex-col gap-3">
          <Input size="xs" placeholder="Extra small" />
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium (default)" />
          <Input size="lg" placeholder="Large" />
          <Input size="xl" placeholder="Extra large" />
        </div>
      </DemoSection>

      <DemoSection title="Textarea" description="Multi-line text input with auto-resize." code={`<Textarea label="Bio" placeholder="Tell us about yourself..." minRows={3} />
<Textarea label="Auto-resize" placeholder="Type more lines..." autoResize minRows={3} maxRows={8} />`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea
            label="Bio"
            placeholder="Tell us about yourself..."
            dirty={dirty}
            value={textareaValue}
            onValueChange={setTextareaValue}
            minRows={3}
          />
          <Textarea
            label="Auto-resize"
            placeholder="Type more lines and watch me grow..."
            autoResize
            dirty={dirty}
            minRows={3}
            maxRows={8}
          />
        </div>
      </DemoSection>

      <DemoSection title="Select" description="Native select with simple and grouped lists." code={`<Select label="Framework" value={value} onValueChange={setValue} list={["react", "vue", "svelte"]} />
<Select label="Language" placeholder="Choose..." list={[
  { label: "Frontend", options: [{ value: "ts", label: "TypeScript" }] },
  { label: "Backend", options: [{ value: "php", label: "PHP" }] },
]} />`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Framework"
            dirty={dirty}
            value={selectValue}
            onValueChange={setSelectValue}
            list={["react", "vue", "svelte", "angular"]}
          />
          <Select
            label="Language (grouped)"
            dirty={dirty}
            placeholder="Choose a language..."
            list={[
              {
                label: "Frontend",
                options: [
                  { value: "typescript", label: "TypeScript" },
                  { value: "javascript", label: "JavaScript" },
                ],
              },
              {
                label: "Backend",
                options: [
                  { value: "php", label: "PHP" },
                  { value: "python", label: "Python" },
                  { value: "go", label: "Go", disabled: true },
                ],
              },
            ]}
          />
        </div>
      </DemoSection>

      <DemoSection title="Checkbox" description="Single checkbox toggle with label and description." code={`<Checkbox label="Accept terms" description="You agree to our terms." checked={checked} onCheckedChange={setChecked} />
<Checkbox label="Indeterminate" indeterminate />
<Checkbox label="Disabled" disabled defaultChecked />`}>
        <div className="flex flex-col gap-4">
          <Checkbox
            label="Accept terms and conditions"
            description="You agree to our terms of service and privacy policy."
            checked={checkboxChecked}
            onCheckedChange={setCheckboxChecked}
            dirty={dirty}
          />
          <Checkbox
            label="Indeterminate state"
            indeterminate
            dirty={dirty}
          />
          <Checkbox
            label="Disabled"
            disabled
            defaultChecked
          />
        </div>
      </DemoSection>

      <DemoSection title="CheckboxGroup" description="Multi-select from a list of options." code={`<CheckboxGroup
  label="Technologies"
  value={value}
  onValueChange={setValue}
  list={[
    { value: "typescript", label: "TypeScript" },
    { value: "react", label: "React" },
  ]}
/>`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxGroup
            label="Technologies"
            description="Select all that apply"
            dirty={dirty}
            value={checkboxGroupValue}
            onValueChange={setCheckboxGroupValue}
            list={[
              { value: "typescript", label: "TypeScript", description: "Typed JavaScript" },
              { value: "react", label: "React" },
              { value: "tailwind", label: "Tailwind CSS" },
              { value: "laravel", label: "Laravel", disabled: true },
            ]}
          />
          <CheckboxGroup
            label="Horizontal layout"
            dirty={dirty}
            orientation="horizontal"
            list={["Small", "Medium", "Large"]}
          />
        </div>
      </DemoSection>

      <DemoSection title="RadioGroup" description="Single-select from a list of options." code={`<RadioGroup
  label="Billing cycle"
  value={value}
  onValueChange={setValue}
  list={[
    { value: "monthly", label: "Monthly", description: "$10/mo" },
    { value: "yearly", label: "Yearly", description: "$100/yr" },
  ]}
/>`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <RadioGroup
            label="Billing cycle"
            dirty={dirty}
            value={radioValue}
            onValueChange={setRadioValue}
            list={[
              { value: "monthly", label: "Monthly", description: "$10/mo" },
              { value: "yearly", label: "Yearly", description: "$100/yr (save 17%)" },
              { value: "lifetime", label: "Lifetime", description: "$299 once" },
            ]}
          />
          <RadioGroup
            label="Priority (horizontal)"
            dirty={dirty}
            orientation="horizontal"
            list={["Low", "Medium", "High"]}
          />
        </div>
      </DemoSection>

      <DemoSection title="Switch" description="Toggle switches with color variants." code={`<Switch label="Notifications" checked={checked} onCheckedChange={setChecked} />
<Switch label="Blue" color="blue" defaultChecked />
<Switch size="sm" label="SM" defaultChecked />`}>
        <div className="flex flex-col gap-4">
          <Switch
            label="Email notifications"
            description="Receive email notifications for updates"
            checked={switchChecked}
            onCheckedChange={setSwitchChecked}
            dirty={dirty}
          />
          <div className="flex flex-wrap gap-4">
            <Switch label="Blue" color="blue" defaultChecked />
            <Switch label="Green" color="green" defaultChecked />
            <Switch label="Red" color="red" defaultChecked />
            <Switch label="Purple" color="purple" defaultChecked />
            <Switch label="Amber" color="amber" defaultChecked />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Switch size="xs" label="XS" defaultChecked />
            <Switch size="sm" label="SM" defaultChecked />
            <Switch size="md" label="MD" defaultChecked />
            <Switch size="lg" label="LG" defaultChecked />
            <Switch size="xl" label="XL" defaultChecked />
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Slider" description="Single value and range sliders." code={`<Slider label="Volume" value={value} onValueChange={setValue} showValue />
<Slider label="With marks" min={0} max={100} step={25} defaultValue={50} marks={[...]} />
<Slider label="Price range" range min={0} max={1000} value={range} onValueChange={setRange} />`}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Slider
            label="Volume"
            dirty={dirty}
            value={sliderValue}
            onValueChange={setSliderValue}
            showValue
          />
          <Slider
            label="With marks"
            dirty={dirty}
            min={0}
            max={100}
            step={25}
            defaultValue={50}
            showValue
            marks={[
              { value: 0, label: "0%" },
              { value: 25, label: "25%" },
              { value: 50, label: "50%" },
              { value: 75, label: "75%" },
              { value: 100, label: "100%" },
            ]}
          />
          <Slider
            label="Price range"
            dirty={dirty}
            range
            min={0}
            max={1000}
            step={10}
            value={rangeSliderValue}
            onValueChange={setRangeSliderValue}
            showValue
          />
        </div>
      </DemoSection>

      <DemoSection title="DatePicker" description="Date and date-time pickers with range mode." code={`<DatePicker label="Start date" value={date} onValueChange={setDate} />
<DatePicker label="With time" includeTime />
<DatePicker label="Date range" range value={range} onValueChange={setRange} />`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker
            label="Start date"
            dirty={dirty}
            value={dateValue}
            onValueChange={setDateValue}
          />
          <DatePicker
            label="With time"
            dirty={dirty}
            includeTime
          />
          <div className="sm:col-span-2">
            <DatePicker
              label="Date range"
              dirty={dirty}
              range
              value={dateRangeValue}
              onValueChange={setDateRangeValue}
            />
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Field (standalone)" description="Field wrapper used standalone for custom layouts." code={`<Field label="Custom field" description="You can wrap any content." required>
  <div>Custom content goes here</div>
</Field>`}>
        <Field label="Custom field" description="You can wrap any content in a Field." required>
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
            Custom content goes here
          </div>
        </Field>
      </DemoSection>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
