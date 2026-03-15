import { Slider } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function SliderDemo() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Slider</h1>

      <DemoSection title="Basic" description="Simple slider with label and value display.">
        <Slider label="Volume" defaultValue={50} showValue />
      </DemoSection>

      <DemoSection title="With Marks" description="Slider with labeled marks.">
        <Slider
          label="Temperature"
          min={0}
          max={100}
          step={25}
          defaultValue={50}
          showValue
          suffix="°C"
          marks={[
            { value: 0, label: "Cold" },
            { value: 25 },
            { value: 50, label: "Warm" },
            { value: 75 },
            { value: 100, label: "Hot" },
          ]}
        />
      </DemoSection>

      <DemoSection title="Range Slider" description="Dual-thumb range selection.">
        <Slider label="Price range" min={0} max={1000} range defaultValue={[200, 800]} showValue prefix="$" />
      </DemoSection>

      <DemoSection title="States" description="Error, dirty, disabled.">
        <div className="flex flex-col gap-4">
          <Slider label="Error" error="Value too low" defaultValue={10} showValue />
          <Slider label="Dirty" dirty defaultValue={75} showValue />
          <Slider label="Disabled" disabled defaultValue={40} showValue />
        </div>
      </DemoSection>
    </div>
  );
}
