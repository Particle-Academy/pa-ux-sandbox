import { Separator } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function SeparatorDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Separator</h1>

      <DemoSection title="Horizontal" description="Default horizontal separator." code={`<Separator />`}>
        <p className="text-sm text-zinc-600">Content above</p>
        <Separator className="my-4" />
        <p className="text-sm text-zinc-600">Content below</p>
      </DemoSection>

      <DemoSection title="With Label" description="Separator with centered text." code={`<Separator label="OR" />`}>
        <Separator label="OR" className="my-4" />
        <Separator label="Section Break" className="my-4" />
      </DemoSection>

      <DemoSection title="Vertical" description="Vertical orientation between inline elements." code={`<Separator orientation="vertical" />`}>
        <div className="flex items-center gap-4 h-8">
          <span className="text-sm">Left</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Center</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Right</span>
        </div>
      </DemoSection>
    </div>
  );
}
