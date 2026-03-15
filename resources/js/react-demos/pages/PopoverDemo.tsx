import { Popover, Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function PopoverDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Popover</h1>

      <DemoSection title="Basic" description="Click-triggered floating content." code={`<Popover>
  <Popover.Trigger>
    <Action>Open Popover</Action>
  </Popover.Trigger>
  <Popover.Content>
    <div className="p-4">Popover content here</div>
  </Popover.Content>
</Popover>`}>
        <Popover>
          <Popover.Trigger>
            <Action>Open Popover</Action>
          </Popover.Trigger>
          <Popover.Content>
            <div className="p-4 w-64">
              <h3 className="font-semibold mb-2">Popover Title</h3>
              <p className="text-sm text-zinc-500">
                This is a popover with arbitrary content. Click outside to close.
              </p>
            </div>
          </Popover.Content>
        </Popover>
      </DemoSection>

      <DemoSection title="Placements" description="Different popover positions." code={`<Popover placement="top">
  <Popover.Trigger>
    <Action>Top</Action>
  </Popover.Trigger>
  <Popover.Content>
    <div className="p-3">Popover on top</div>
  </Popover.Content>
</Popover>`}>
        <div className="flex flex-wrap gap-4 py-4">
          <Popover placement="top">
            <Popover.Trigger>
              <Action size="sm">Top</Action>
            </Popover.Trigger>
            <Popover.Content>
              <div className="p-3 text-sm">Popover on top</div>
            </Popover.Content>
          </Popover>
          <Popover placement="bottom">
            <Popover.Trigger>
              <Action size="sm">Bottom</Action>
            </Popover.Trigger>
            <Popover.Content>
              <div className="p-3 text-sm">Popover on bottom</div>
            </Popover.Content>
          </Popover>
          <Popover placement="left">
            <Popover.Trigger>
              <Action size="sm">Left</Action>
            </Popover.Trigger>
            <Popover.Content>
              <div className="p-3 text-sm">Popover on left</div>
            </Popover.Content>
          </Popover>
          <Popover placement="right">
            <Popover.Trigger>
              <Action size="sm">Right</Action>
            </Popover.Trigger>
            <Popover.Content>
              <div className="p-3 text-sm">Popover on right</div>
            </Popover.Content>
          </Popover>
        </div>
      </DemoSection>
    </div>
  );
}
