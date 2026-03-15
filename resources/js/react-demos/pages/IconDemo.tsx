import { useState } from "react";
import {
  Icon,
  registerIconSet,
  Action,
  Callout,
  Input,
  Badge,
  Timeline,
} from "@particle-academy/react-fancy";
import type { IconSet } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

// Register a demo custom icon set
const demoIconSet: IconSet = {
  resolve: (name: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
      checkmark: ({ className, size = 24 }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      cross: ({ className, size = 24 }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className}>
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
      flame: ({ className, size = 24 }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
          <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.037 2.382-5.964 4.5-8.5L12 4l2.5 3.5C16.618 10.036 19 12.963 19 16c0 3.866-3.134 7-7 7zm0-2a5 5 0 005-5c0-2.14-1.7-4.34-3.5-6.5L12 7.5l-1.5 2C8.7 11.66 7 13.86 7 16a5 5 0 005 5z" />
        </svg>
      ),
    };
    return icons[name] ?? null;
  },
};
registerIconSet("demo", demoIconSet);

export function IconDemo() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Icon</h1>

      <DemoSection
        title="Named Icons (Lucide)"
        description="Use the name prop to render any Lucide icon by its kebab-case name. No imports needed."
        code={`<Icon name="rocket" />
<Icon name="heart" />
<Icon name="arrow-right" />
<Icon name="settings" />
<Icon name="bell" />
<Icon name="search" />
<Icon name="check-circle" />
<Icon name="shield" />`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {["rocket", "heart", "arrow-right", "settings", "bell", "search", "check-circle", "shield", "star", "zap", "globe", "camera", "music", "mail", "cloud", "lock"].map((name) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <Icon name={name} size="lg" className="text-zinc-700 dark:text-zinc-300" />
              <span className="text-[10px] text-zinc-400">{name}</span>
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Sizes"
        description="Five size presets from xs (12px) to xl (32px)."
        code={`<Icon name="rocket" size="xs" />
<Icon name="rocket" size="sm" />
<Icon name="rocket" size="md" />  {/* default */}
<Icon name="rocket" size="lg" />
<Icon name="rocket" size="xl" />`}
      >
        <div className="flex items-end gap-6">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Icon name="rocket" size={size} className="text-blue-500" />
              <span className="text-xs text-zinc-400">{size}</span>
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Colors"
        description="Icons inherit currentColor. Use Tailwind text color classes to style them."
        code={`<Icon name="heart" className="text-rose-500" />
<Icon name="star" className="text-amber-500" />
<Icon name="shield" className="text-emerald-500" />
<Icon name="zap" className="text-purple-500" />`}
      >
        <div className="flex items-center gap-5">
          <Icon name="heart" size="lg" className="text-rose-500" />
          <Icon name="star" size="lg" className="text-amber-500" />
          <Icon name="shield" size="lg" className="text-emerald-500" />
          <Icon name="zap" size="lg" className="text-purple-500" />
          <Icon name="flame" size="lg" className="text-orange-500" />
          <Icon name="droplets" size="lg" className="text-cyan-500" />
        </div>
      </DemoSection>

      <DemoSection
        title="Custom Icon Set"
        description="Register your own icon sets with registerIconSet and use them via the iconSet prop."
        code={`import { registerIconSet } from "@particle-academy/react-fancy";
import type { IconSet } from "@particle-academy/react-fancy";

const myIcons: IconSet = {
  resolve: (name) => {
    const icons = {
      checkmark: ({ size }) => <svg>...</svg>,
      cross: ({ size }) => <svg>...</svg>,
    };
    return icons[name] ?? null;
  },
};

registerIconSet("my-set", myIcons);

<Icon name="checkmark" iconSet="my-set" />
<Icon name="cross" iconSet="my-set" />`}
      >
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-1.5">
            <Icon name="checkmark" iconSet="demo" size="lg" className="text-emerald-500" />
            <span className="text-[10px] text-zinc-400">checkmark</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Icon name="cross" iconSet="demo" size="lg" className="text-rose-500" />
            <span className="text-[10px] text-zinc-400">cross</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Icon name="flame" iconSet="demo" size="lg" className="text-orange-500" />
            <span className="text-[10px] text-zinc-400">flame</span>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Inside Action Buttons"
        description="Actions accept an icon slug to place icons alongside text."
        code={`<Action icon="pencil">Edit</Action>
<Action icon="trash-2" color="danger">Delete</Action>
<Action icon="plus" color="accent">New Item</Action>
<Action icon="download" variant="ghost">Export</Action>`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Action icon="pencil">Edit</Action>
          <Action icon="trash-2" color="danger">Delete</Action>
          <Action icon="plus" color="accent">New Item</Action>
          <Action icon="download" variant="ghost">Export</Action>
          <Action icon="share-2" variant="outline">Share</Action>
        </div>
      </DemoSection>

      <DemoSection
        title="Inside Input Fields"
        description="Input components accept leading and trailing elements — icons are the most common use."
        code={`<Input
  leading={<Icon name="search" size="sm" />}
  placeholder="Search..."
/>
<Input
  leading={<Icon name="mail" size="sm" />}
  trailing={<Icon name="check" size="sm" className="text-emerald-500" />}
  placeholder="Email address"
/>`}
      >
        <div className="flex max-w-sm flex-col gap-3">
          <Input
            leading={<Icon name="search" size="sm" />}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            leading={<Icon name="mail" size="sm" />}
            trailing={<Icon name="check" size="sm" className="text-emerald-500" />}
            placeholder="Email address"
          />
          <Input
            leading={<Icon name="lock" size="sm" />}
            placeholder="Password"
            type="password"
          />
        </div>
      </DemoSection>

      <DemoSection
        title="Inside Callouts"
        description="Callouts display an icon alongside a message to reinforce intent."
        code={`<Callout color="blue" icon={<Icon name="info" />}>
  New features are available.
</Callout>
<Callout color="green" icon={<Icon name="check-circle" />}>
  Your changes have been saved.
</Callout>
<Callout color="red" icon={<Icon name="alert-triangle" />}>
  Something went wrong.
</Callout>`}
      >
        <div className="flex flex-col gap-3">
          <Callout color="blue" icon={<Icon name="info" />}>
            New features are available. Check the changelog for details.
          </Callout>
          <Callout color="green" icon={<Icon name="check-circle" />}>
            Your changes have been saved successfully.
          </Callout>
          <Callout color="red" icon={<Icon name="alert-triangle" />}>
            Something went wrong. Please try again.
          </Callout>
          <Callout color="amber" icon={<Icon name="alert-circle" />}>
            Your trial expires in 3 days.
          </Callout>
        </div>
      </DemoSection>

      <DemoSection
        title="Inside Badges"
        description="Pair small icons with Badge for labelled status indicators."
        code={`<Badge color="green">
  <Icon name="check" size="xs" /> Active
</Badge>
<Badge color="red">
  <Icon name="x" size="xs" /> Offline
</Badge>`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge color="green"><Icon name="check" size="xs" /> Active</Badge>
          <Badge color="red"><Icon name="x" size="xs" /> Offline</Badge>
          <Badge color="blue"><Icon name="clock" size="xs" /> Pending</Badge>
          <Badge color="amber"><Icon name="alert-triangle" size="xs" /> Warning</Badge>
          <Badge color="purple"><Icon name="sparkles" size="xs" /> New</Badge>
        </div>
      </DemoSection>

      <DemoSection
        title="Inside Timeline"
        description="Timeline items can replace the default dot with a custom icon."
        code={`<Timeline>
  <Timeline.Item icon={<Icon name="git-commit" />} color="blue">
    Initial commit
  </Timeline.Item>
  <Timeline.Item icon={<Icon name="git-branch" />} color="purple">
    Feature branch created
  </Timeline.Item>
  <Timeline.Item icon={<Icon name="check-circle" />} color="green">
    Merged to main
  </Timeline.Item>
</Timeline>`}
      >
        <Timeline>
          <Timeline.Item icon={<Icon name="git-commit" />} color="blue">
            <span className="font-medium">Initial commit</span>
            <span className="block text-sm text-zinc-500">Set up project scaffolding</span>
          </Timeline.Item>
          <Timeline.Item icon={<Icon name="git-branch" />} color="purple">
            <span className="font-medium">Feature branch created</span>
            <span className="block text-sm text-zinc-500">feat/icon-improvements</span>
          </Timeline.Item>
          <Timeline.Item icon={<Icon name="message-square" />} color="amber">
            <span className="font-medium">Code review requested</span>
            <span className="block text-sm text-zinc-500">2 reviewers assigned</span>
          </Timeline.Item>
          <Timeline.Item icon={<Icon name="check-circle" />} color="green">
            <span className="font-medium">Merged to main</span>
            <span className="block text-sm text-zinc-500">All checks passed</span>
          </Timeline.Item>
        </Timeline>
      </DemoSection>
    </div>
  );
}
