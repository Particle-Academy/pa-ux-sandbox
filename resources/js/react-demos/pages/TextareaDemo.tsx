import { Textarea } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function TextareaDemo() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Textarea</h1>

      <DemoSection title="Basic" description="Multi-line text input.">
        <Textarea label="Message" placeholder="Type your message..." />
      </DemoSection>

      <DemoSection title="Auto Resize" description="Grows with content up to maxRows.">
        <Textarea label="Auto-resize" autoResize minRows={2} maxRows={8} placeholder="Start typing and watch it grow..." />
      </DemoSection>

      <DemoSection title="States" description="Error, dirty, and disabled.">
        <div className="flex flex-col gap-3">
          <Textarea label="Error" error="Message is too short" placeholder="Error state" />
          <Textarea label="Dirty" dirty defaultValue="Modified content" />
          <Textarea label="Disabled" disabled placeholder="Cannot edit" />
        </div>
      </DemoSection>
    </div>
  );
}
