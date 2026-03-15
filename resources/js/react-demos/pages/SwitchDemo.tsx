import { useState } from "react";
import { Switch } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function SwitchDemo() {
  const [on, setOn] = useState(false);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Switch</h1>

      <DemoSection title="Basic" description="Toggle switch with label.">
        <Switch label="Enable notifications" checked={on} onCheckedChange={setOn} />
        <p className="mt-2 text-sm text-zinc-500">Enabled: {String(on)}</p>
      </DemoSection>

      <DemoSection title="Colors" description="Switch with different accent colors.">
        <div className="flex flex-col gap-3">
          <Switch label="Blue" color="blue" defaultChecked />
          <Switch label="Green" color="green" defaultChecked />
          <Switch label="Red" color="red" defaultChecked />
          <Switch label="Purple" color="purple" defaultChecked />
          <Switch label="Amber" color="amber" defaultChecked />
        </div>
      </DemoSection>

      <DemoSection title="Sizes" description="Available sizes.">
        <div className="flex flex-col gap-3">
          <Switch label="Extra small" size="xs" defaultChecked />
          <Switch label="Small" size="sm" defaultChecked />
          <Switch label="Medium" size="md" defaultChecked />
          <Switch label="Large" size="lg" defaultChecked />
          <Switch label="Extra large" size="xl" defaultChecked />
        </div>
      </DemoSection>

      <DemoSection title="States" description="Disabled and with description.">
        <div className="flex flex-col gap-3">
          <Switch label="With description" description="This enables dark mode across the app" />
          <Switch label="Disabled off" disabled />
          <Switch label="Disabled on" disabled defaultChecked />
        </div>
      </DemoSection>
    </div>
  );
}
