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

      <DemoSection title="With Submenus" description="Hover or click a submenu trigger to open nested menus. Submenus nest arbitrarily deep." code={`<ContextMenu>
  <ContextMenu.Trigger>...</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>Edit</ContextMenu.Item>
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger>Share via</ContextMenu.SubTrigger>
      <ContextMenu.SubContent>
        <ContextMenu.Item>Email</ContextMenu.Item>
        <ContextMenu.Item>Slack</ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>Social</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Twitter</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.SubContent>
    </ContextMenu.Sub>
  </ContextMenu.Content>
</ContextMenu>`}>
        <ContextMenu>
          <ContextMenu.Trigger>
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-600">
              Right-click for nested menus
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item onClick={() => alert("Edit")}>Edit</ContextMenu.Item>
            <ContextMenu.Item onClick={() => alert("Duplicate")}>Duplicate</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>Share via</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item onClick={() => alert("Email")}>Email</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Slack")}>Slack</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Link copied")}>Copy link</ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Sub>
                  <ContextMenu.SubTrigger>Social</ContextMenu.SubTrigger>
                  <ContextMenu.SubContent>
                    <ContextMenu.Item onClick={() => alert("Twitter")}>Twitter</ContextMenu.Item>
                    <ContextMenu.Item onClick={() => alert("LinkedIn")}>LinkedIn</ContextMenu.Item>
                    <ContextMenu.Item onClick={() => alert("Bluesky")}>Bluesky</ContextMenu.Item>
                  </ContextMenu.SubContent>
                </ContextMenu.Sub>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>Move to</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item onClick={() => alert("Archive")}>Archive</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Drafts")}>Drafts</ContextMenu.Item>
                <ContextMenu.Item onClick={() => alert("Trash")} danger>Trash</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
            <ContextMenu.Separator />
            <ContextMenu.Item disabled>Pin (unavailable)</ContextMenu.Item>
            <ContextMenu.Item onClick={() => alert("Deleted")} danger>Delete</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      </DemoSection>
    </div>
  );
}
