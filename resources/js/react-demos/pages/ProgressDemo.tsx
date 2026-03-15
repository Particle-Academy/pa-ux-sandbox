import { useState } from "react";
import { Progress } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ProgressDemo() {
  const [value, setValue] = useState(65);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Progress</h1>

      <DemoSection title="Bar" description="Linear progress bar with interactive value." code={`<Progress value={65} showValue />`}>
        <div className="space-y-4 max-w-md">
          <Progress value={value} showValue />
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </DemoSection>

      <DemoSection title="Colors" description="Available color variants." code={`<Progress value={80} color="blue" />
<Progress value={60} color="green" />
<Progress value={45} color="amber" />
<Progress value={30} color="red" />`}>
        <div className="space-y-3 max-w-md">
          <Progress value={80} color="blue" />
          <Progress value={60} color="green" />
          <Progress value={45} color="amber" />
          <Progress value={30} color="red" />
          <Progress value={70} color="violet" />
        </div>
      </DemoSection>

      <DemoSection title="Sizes" description="Small, medium, and large bar heights." code={`<Progress value={60} size="sm" />
<Progress value={60} size="md" />
<Progress value={60} size="lg" />`}>
        <div className="space-y-3 max-w-md">
          <Progress value={60} size="sm" />
          <Progress value={60} size="md" />
          <Progress value={60} size="lg" />
        </div>
      </DemoSection>

      <DemoSection title="Circular" description="Circular progress indicator." code={`<Progress variant="circular" value={75} size="lg" showValue color="green" />`}>
        <div className="flex items-end gap-6">
          <Progress variant="circular" value={25} size="sm" showValue />
          <Progress variant="circular" value={50} size="md" showValue />
          <Progress variant="circular" value={75} size="lg" showValue color="green" />
        </div>
      </DemoSection>

      <DemoSection title="Indeterminate" description="Loading state without a known value." code={`<Progress indeterminate />
<Progress variant="circular" indeterminate size="md" />`}>
        <div className="flex items-center gap-6">
          <Progress indeterminate className="max-w-md" />
          <Progress variant="circular" indeterminate size="md" />
        </div>
      </DemoSection>
    </div>
  );
}
