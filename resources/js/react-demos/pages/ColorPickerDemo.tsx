import { useState } from "react";
import { ColorPicker } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ColorPickerDemo() {
  const [color, setColor] = useState("#3b82f6");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ColorPicker</h1>

      <DemoSection
        title="Controlled"
        description="Click the swatch to open the native color picker."
        code={`<ColorPicker value={color} onChange={setColor} />`}
      >
        <ColorPicker value={color} onChange={setColor} />
        <p className="mt-3 text-sm text-zinc-500">
          Selected: <span className="font-medium font-mono">{color}</span>
        </p>
      </DemoSection>

      <DemoSection title="Sizes" description="Small, medium, and large swatches." code={`<ColorPicker size="sm" defaultValue="#ef4444" />
<ColorPicker size="md" defaultValue="#10b981" />
<ColorPicker size="lg" defaultValue="#8b5cf6" />`}>
        <div className="space-y-4">
          <ColorPicker size="sm" defaultValue="#ef4444" />
          <ColorPicker size="md" defaultValue="#10b981" />
          <ColorPicker size="lg" defaultValue="#8b5cf6" />
        </div>
      </DemoSection>

      <DemoSection title="With Presets" description="Preset color values for quick selection." code={`<ColorPicker
  defaultValue="#f59e0b"
  presets={["#ef4444", "#f59e0b", "#10b981", "#3b82f6"]}
/>`}>
        <ColorPicker
          defaultValue="#f59e0b"
          presets={["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"]}
        />
      </DemoSection>

      <DemoSection title="Disabled" description="Non-interactive color picker." code={`<ColorPicker value="#6b7280" disabled />`}>
        <ColorPicker value="#6b7280" disabled />
      </DemoSection>
    </div>
  );
}
