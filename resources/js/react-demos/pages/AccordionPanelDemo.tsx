import { useState } from "react";
import {
  AccordionPanel,
  Action,
  Badge,
  useAccordionSection,
} from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

// Mock workspace nav modeled on the screenshots provided. The "WB" avatar
// + Home button + gear are anchors; everything else lives in collapsible
// sections.
function MenuShell({
  defaultOpen,
}: {
  defaultOpen?: string[];
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 p-2 ring-1 ring-zinc-800">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-900">
        WB
      </div>

      <AccordionPanel
        orientation="horizontal"
        defaultValue={defaultOpen}
        className="gap-1"
      >
        <AccordionPanel.Section id="home" pinned>
          <Action variant="ghost" icon="home" size="sm" />
        </AccordionPanel.Section>

        <AccordionPanel.Section id="primary">
          <AccordionPanel.Trigger />
          <AccordionPanel.Content>
            <Action variant="ghost" icon="bookmark" size="sm">
              Wishlist <Badge color="zinc" size="sm" className="ml-1">1</Badge>
            </Action>
            <Action variant="ghost" icon="mail" size="sm">
              Feedback
            </Action>
            <Action variant="ghost" icon="file-text" size="sm">
              Plans
            </Action>
            <Action variant="ghost" icon="play" size="sm" color="emerald">
              WIP
            </Action>
          </AccordionPanel.Content>
        </AccordionPanel.Section>

        <AccordionPanel.Section id="secondary">
          <AccordionPanel.Trigger />
          <AccordionPanel.Content>
            <Action variant="ghost" icon="grid" size="sm">
              Board
            </Action>
            <Action variant="ghost" icon="zap" size="sm" color="rose" alert>
              VIP
            </Action>
          </AccordionPanel.Content>
        </AccordionPanel.Section>

        <AccordionPanel.Section id="extras">
          <AccordionPanel.Trigger />
          <AccordionPanel.Content>
            <Action variant="ghost" icon="rocket" size="sm">
              Releases
            </Action>
            <Action variant="ghost" icon="settings" size="sm">
              Features
            </Action>
            <Action variant="ghost" icon="activity" size="sm">
              Activity
            </Action>
          </AccordionPanel.Content>
        </AccordionPanel.Section>
      </AccordionPanel>

      <Action variant="ghost" icon="settings" size="sm" />
    </div>
  );
}

// Custom trigger sample — a tiny pill that flips between "expand" / "collapse"
function PillTrigger() {
  const { open, toggle } = useAccordionSection();
  return (
    <button
      type="button"
      onClick={toggle}
      className="mx-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300 hover:bg-zinc-700"
    >
      {open ? "Hide" : "Show"}
    </button>
  );
}

export function AccordionPanelDemo() {
  const [openSet, setOpenSet] = useState<string[]>(["primary"]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">AccordionPanel</h1>
      <p className="mb-8 text-sm text-zinc-500 max-w-2xl">
        Horizontal or vertical accordion of collapsible sections. Sized for
        both menus/toolbars and full-page panels. Hover the divider between
        two open sections to reveal the collapse handle.
      </p>

      <DemoSection
        title="Fully collapsed"
        description="Three secondary sections collapsed; only Home is shown."
        code={`<AccordionPanel orientation="horizontal" defaultValue={[]}>
  <AccordionPanel.Section id="home" pinned>...</AccordionPanel.Section>
  <AccordionPanel.Section id="primary">
    <AccordionPanel.Trigger />
    <AccordionPanel.Content>...</AccordionPanel.Content>
  </AccordionPanel.Section>
  ...
</AccordionPanel>`}
      >
        <MenuShell defaultOpen={[]} />
      </DemoSection>

      <DemoSection
        title="One section open"
        description="Primary section expanded; secondary + extras still collapsed."
      >
        <MenuShell defaultOpen={["primary"]} />
      </DemoSection>

      <DemoSection
        title="Mid-row collapsed"
        description="Primary + secondary open with extras collapsed; the trigger between primary and secondary appears as a chevron in the row."
      >
        <MenuShell defaultOpen={["primary", "secondary"]} />
      </DemoSection>

      <DemoSection
        title="Fully expanded"
        description="All sections open. Hover any divider to reveal the collapse handle."
      >
        <MenuShell defaultOpen={["primary", "secondary", "extras"]} />
      </DemoSection>

      <DemoSection
        title="Controlled"
        description="External state, fires onValueChange on every toggle."
        code={`const [open, setOpen] = useState(["primary"]);
<AccordionPanel value={open} onValueChange={setOpen}>...</AccordionPanel>`}
      >
        <div className="flex flex-col gap-3">
          <MenuShell defaultOpen={openSet} />
          <button
            onClick={() =>
              setOpenSet((s) =>
                s.length === 3 ? [] : ["primary", "secondary", "extras"],
              )
            }
            className="self-start rounded-md bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {openSet.length === 3 ? "Collapse all" : "Expand all"}
          </button>
          <p className="text-xs text-zinc-500">
            Open ids: {openSet.length ? openSet.join(", ") : "(none)"}
          </p>
        </div>
      </DemoSection>

      <DemoSection
        title="Custom trigger via render-prop"
        description="Trigger reads section state via context. children can be a node or a render function."
        code={`<AccordionPanel.Trigger>
  {({ open }) => (open ? "Hide" : "Show")}
</AccordionPanel.Trigger>`}
      >
        <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 p-2 ring-1 ring-zinc-800">
          <AccordionPanel orientation="horizontal" defaultValue={["a"]}>
            <AccordionPanel.Section id="a">
              <AccordionPanel.Trigger>
                <PillTrigger />
              </AccordionPanel.Trigger>
              <AccordionPanel.Content>
                <Action variant="ghost" size="sm">First</Action>
                <Action variant="ghost" size="sm">Second</Action>
                <Action variant="ghost" size="sm">Third</Action>
              </AccordionPanel.Content>
            </AccordionPanel.Section>
            <AccordionPanel.Section id="b">
              <AccordionPanel.Trigger>
                <PillTrigger />
              </AccordionPanel.Trigger>
              <AccordionPanel.Content>
                <Action variant="ghost" size="sm">Alpha</Action>
                <Action variant="ghost" size="sm">Beta</Action>
              </AccordionPanel.Content>
            </AccordionPanel.Section>
          </AccordionPanel>
        </div>
      </DemoSection>

      <DemoSection
        title="Vertical orientation"
        description="Same component, vertical axis. Triggers turn into horizontal divider bars."
      >
        <div className="rounded-2xl bg-zinc-900 p-3 ring-1 ring-zinc-800">
          <AccordionPanel
            orientation="vertical"
            defaultValue={["files", "tools"]}
            className="w-56"
          >
            <AccordionPanel.Section id="files">
              <AccordionPanel.Content className="w-full items-stretch">
                <Action variant="ghost" size="sm" icon="folder" className="justify-start">
                  components/
                </Action>
                <Action variant="ghost" size="sm" icon="file-text" className="justify-start">
                  README.md
                </Action>
                <Action variant="ghost" size="sm" icon="file-text" className="justify-start">
                  package.json
                </Action>
              </AccordionPanel.Content>
              <AccordionPanel.Trigger />
            </AccordionPanel.Section>

            <AccordionPanel.Section id="tools">
              <AccordionPanel.Content className="w-full items-stretch">
                <Action variant="ghost" size="sm" icon="terminal" className="justify-start">
                  Terminal
                </Action>
                <Action variant="ghost" size="sm" icon="bug" className="justify-start">
                  Debugger
                </Action>
              </AccordionPanel.Content>
              <AccordionPanel.Trigger />
            </AccordionPanel.Section>

            <AccordionPanel.Section id="output">
              <AccordionPanel.Content className="w-full items-stretch">
                <Action variant="ghost" size="sm" icon="list" className="justify-start">
                  Build log
                </Action>
              </AccordionPanel.Content>
              <AccordionPanel.Trigger />
            </AccordionPanel.Section>
          </AccordionPanel>
        </div>
      </DemoSection>
    </div>
  );
}
