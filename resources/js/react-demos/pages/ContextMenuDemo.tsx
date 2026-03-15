import { ContextMenu } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ContextMenuDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ContextMenu</h1>

      <DemoSection title="Basic" description="Right-click the area below to open the context menu." code={`<ContextMenu>
  <ContextMenu.Trigger>
    <div>Right-click here</div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item onClick={() => {}}>Cut</ContextMenu.Item>
    <ContextMenu.Item onClick={() => {}}>Copy</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item danger>Delete</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>`}>
        <ContextMenu>
          <ContextMenu.Trigger>
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-600">
              Right-click here
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item onClick={() => alert("Cut")}>Cut</ContextMenu.Item>
            <ContextMenu.Item onClick={() => alert("Copy")}>Copy</ContextMenu.Item>
            <ContextMenu.Item onClick={() => alert("Paste")}>Paste</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item onClick={() => alert("Select All")}>Select All</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item onClick={() => alert("Delete")} danger>
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      </DemoSection>
    </div>
  );
}
