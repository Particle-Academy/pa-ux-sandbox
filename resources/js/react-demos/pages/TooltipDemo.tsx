import { Tooltip, Button } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function TooltipDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tooltip</h1>

      <DemoSection title="Placements" description="Tooltip positioning around the trigger." code={`<Tooltip content="Appears on top" placement="top">
  <Button>Top</Button>
</Tooltip>
<Tooltip content="Appears on bottom" placement="bottom">
  <Button>Bottom</Button>
</Tooltip>`}>
        <div className="flex flex-wrap items-center gap-4 py-8">
          <Tooltip content="Appears on top" placement="top">
            <Button>Top</Button>
          </Tooltip>
          <Tooltip content="Appears on bottom" placement="bottom">
            <Button>Bottom</Button>
          </Tooltip>
          <Tooltip content="Appears on left" placement="left">
            <Button>Left</Button>
          </Tooltip>
          <Tooltip content="Appears on right" placement="right">
            <Button>Right</Button>
          </Tooltip>
        </div>
      </DemoSection>

      <DemoSection title="Rich Content" description="Tooltips can contain formatted text." code={`<Tooltip content={
  <div>
    <p className="font-semibold">Keyboard shortcut</p>
    <p>Ctrl + S</p>
  </div>
}>
  <Button>Hover for details</Button>
</Tooltip>`}>
        <Tooltip
          content={
            <div>
              <p className="font-semibold">Keyboard shortcut</p>
              <p className="text-zinc-300">Ctrl + S</p>
            </div>
          }
        >
          <Button>Hover for details</Button>
        </Tooltip>
      </DemoSection>
    </div>
  );
}
