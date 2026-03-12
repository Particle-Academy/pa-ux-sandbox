import { useState } from "react";
import { ColorPicker, type Color } from "@fancy/react";
import { DemoSection } from "../components/DemoSection";

export function ColorPickerDemo() {
  const [color, setColor] = useState<Color>("blue");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ColorPicker</h1>

      <DemoSection
        title="Controlled"
        description="Select a color from the palette."
      >
        <ColorPicker value={color} onChange={setColor} />
        <p className="mt-3 text-sm text-zinc-500">
          Selected: <span className="font-medium">{color}</span>
        </p>
      </DemoSection>

      <DemoSection title="Sizes">
        <div className="space-y-4">
          <ColorPicker size="sm" colors={["red", "blue", "green", "purple"]} />
          <ColorPicker size="md" colors={["red", "blue", "green", "purple"]} />
          <ColorPicker size="lg" colors={["red", "blue", "green", "purple"]} />
        </div>
      </DemoSection>
    </div>
  );
}
