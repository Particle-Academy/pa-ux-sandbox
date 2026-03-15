import { useState, useEffect } from "react";
import { Command, Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function CommandDemo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Command</h1>

      <DemoSection title="Command Palette" description="Press Ctrl+K or click the button to open." code={`<Command open={open} onClose={() => setOpen(false)}>
  <Command.Input placeholder="Type a command..." />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>
    <Command.Group heading="Navigation">
      <Command.Item value="home" onSelect={...}>Home</Command.Item>
      <Command.Item value="settings" onSelect={...}>Settings</Command.Item>
    </Command.Group>
  </Command.List>
</Command>`}>
        <Action onClick={() => setOpen(true)}>Open Command Palette</Action>
        <p className="mt-2 text-sm text-zinc-500">
          Or press <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">Ctrl+K</kbd>
        </p>

        <Command open={open} onClose={() => setOpen(false)}>
          <Command.Input placeholder="Type a command..." />
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>
            <Command.Group heading="Navigation">
              <Command.Item value="home" onSelect={() => setOpen(false)}>
                Home
              </Command.Item>
              <Command.Item value="settings" onSelect={() => setOpen(false)}>
                Settings
              </Command.Item>
              <Command.Item value="profile" onSelect={() => setOpen(false)}>
                Profile
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Actions">
              <Command.Item value="new-project" onSelect={() => setOpen(false)}>
                Create New Project
              </Command.Item>
              <Command.Item value="invite" onSelect={() => setOpen(false)}>
                Invite Team Member
              </Command.Item>
              <Command.Item value="export" onSelect={() => setOpen(false)}>
                Export Data
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DemoSection>
    </div>
  );
}
