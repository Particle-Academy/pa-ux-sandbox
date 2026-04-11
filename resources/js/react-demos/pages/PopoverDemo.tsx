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
    <p>Popover content here</p>
  </Popover.Content>
</Popover>`}>
        <Popover>
          <Popover.Trigger>
            <Action>Open Popover</Action>
          </Popover.Trigger>
          <Popover.Content>
            <div className="w-64">
              <h3 className="font-semibold mb-2">Popover Title</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                This is a popover with arbitrary content. Click outside to close.
              </p>
            </div>
          </Popover.Content>
        </Popover>
      </DemoSection>

      <DemoSection title="Hover" description="Opens on hover with configurable delays." code={`<Popover hover>
  <Popover.Trigger>
    <Action>Hover me</Action>
  </Popover.Trigger>
  <Popover.Content>
    <p>Hoverable content</p>
  </Popover.Content>
</Popover>`}>
        <div className="flex gap-4">
          <Popover hover>
            <Popover.Trigger>
              <Action>Hover me</Action>
            </Popover.Trigger>
            <Popover.Content>
              <div className="w-56">
                <h3 className="font-semibold mb-1">Hover Popover</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Move your mouse here — the popover stays open.
                </p>
              </div>
            </Popover.Content>
          </Popover>

          <Popover hover placement="right">
            <Popover.Trigger>
              <Action>Details</Action>
            </Popover.Trigger>
            <Popover.Content>
              <div className="w-48">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Additional info shown on hover.
                </p>
              </div>
            </Popover.Content>
          </Popover>
        </div>
      </DemoSection>

      <DemoSection title="Placements" description="Different popover positions." code={`<Popover placement="top">...</Popover>`}>
        <div className="flex flex-wrap gap-4 py-4">
          {(["top", "bottom", "left", "right"] as const).map((p) => (
            <Popover key={p} placement={p}>
              <Popover.Trigger>
                <Action size="sm">{p.charAt(0).toUpperCase() + p.slice(1)}</Action>
              </Popover.Trigger>
              <Popover.Content>
                <div className="text-sm">Popover on {p}</div>
              </Popover.Content>
            </Popover>
          ))}
        </div>
      </DemoSection>

      <DemoSection title="Rich Content (Hover)" description="Hover popover with complex content.">
        <Popover hover>
          <Popover.Trigger>
            <Action>User Profile</Action>
          </Popover.Trigger>
          <Popover.Content>
            <div className="w-72">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <div className="font-semibold">Jane Doe</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">jane@example.com</div>
                </div>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 text-sm text-zinc-500 dark:text-zinc-400">
                <p>Senior Engineer · San Francisco</p>
              </div>
            </div>
          </Popover.Content>
        </Popover>
      </DemoSection>
    </div>
  );
}
