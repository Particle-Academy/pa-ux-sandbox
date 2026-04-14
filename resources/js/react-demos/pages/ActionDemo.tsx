import { Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ActionDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Action</h1>

      {/* State Variants */}
      <DemoSection title="State Variants" description="Default, active, checked, and warn states." code={`<Action>Default</Action>
<Action active>Active</Action>
<Action checked>Checked</Action>
<Action warn>Warn</Action>`}>
        <div className="flex items-center gap-3">
          <Action>Default</Action>
          <Action active>Active</Action>
          <Action checked>Checked</Action>
          <Action warn>Warn</Action>
        </div>
      </DemoSection>

      {/* Alert Animation */}
      <DemoSection title="Alert Animation" description="Pulse animation on various states." code={`<Action alert>Default Alert</Action>
<Action active alert>Active Alert</Action>
<Action warn alert>Warn Alert</Action>`}>
        <div className="flex items-center gap-3">
          <Action alert>Default Alert</Action>
          <Action active alert>Active Alert</Action>
          <Action warn alert>Warn Alert</Action>
        </div>
      </DemoSection>

      {/* Size Variants */}
      <DemoSection title="Size Variants" description="Five size options from xs to xl." code={`<Action size="xs">Extra Small</Action>
<Action size="sm">Small</Action>
<Action size="md">Medium</Action>
<Action size="lg">Large</Action>
<Action size="xl">Extra Large</Action>`}>
        <div className="flex items-center gap-3">
          <Action size="xs">Extra Small</Action>
          <Action size="sm">Small</Action>
          <Action size="md">Medium</Action>
          <Action size="lg">Large</Action>
          <Action size="xl">Extra Large</Action>
        </div>
      </DemoSection>

      {/* Standalone Colors */}
      <DemoSection title="Standalone Colors" description="All 10 standalone color options." code={`<Action color="blue">Blue</Action>
<Action color="emerald">Emerald</Action>
<Action color="amber">Amber</Action>
<Action color="red">Red</Action>
<Action color="violet">Violet</Action>
<Action color="indigo">Indigo</Action>
<Action color="sky">Sky</Action>
<Action color="rose">Rose</Action>
<Action color="orange">Orange</Action>
<Action color="zinc">Zinc</Action>`}>
        <div className="flex flex-wrap items-center gap-3">
          <Action color="blue">Blue</Action>
          <Action color="emerald">Emerald</Action>
          <Action color="amber">Amber</Action>
          <Action color="red">Red</Action>
          <Action color="violet">Violet</Action>
          <Action color="indigo">Indigo</Action>
          <Action color="sky">Sky</Action>
          <Action color="rose">Rose</Action>
          <Action color="orange">Orange</Action>
          <Action color="zinc">Zinc</Action>
        </div>
      </DemoSection>

      {/* With Icons */}
      <DemoSection title="With Icons" description="Icon placement: left, right, top, bottom." code={`<Action icon="pencil">Edit</Action>
<Action icon="chevron-right" iconPlace="right">Next</Action>
<Action iconTrailing="chevron-right">Continue</Action>
<Action icon="arrow-up" iconPlace="top">Upload</Action>
<Action icon="star" iconPlace="bottom">Star</Action>`}>
        <div className="flex items-end gap-3">
          <Action icon="pencil">Edit</Action>
          <Action icon="chevron-right" iconPlace="right">Next</Action>
          <Action iconTrailing="chevron-right">Continue</Action>
          <Action icon="arrow-up" iconPlace="top">Upload</Action>
          <Action icon="star" iconPlace="bottom">Star</Action>
        </div>
      </DemoSection>

      {/* Alert Icons */}
      <DemoSection title="Alert Icons" description="Pulsing alert icons with ping animation." code={`<Action alertIcon="bell">Notifications</Action>
<Action alertIcon="bell" alertIconTrailing>Alerts</Action>
<Action color="red" alertIcon="bell">Urgent</Action>`}>
        <div className="flex items-center gap-3">
          <Action alertIcon="bell">Notifications</Action>
          <Action alertIcon="bell" alertIconTrailing>Alerts</Action>
          <Action color="red" alertIcon="bell">Urgent</Action>
        </div>
      </DemoSection>

      {/* Emoji Support */}
      <DemoSection title="Emoji Support" description="Emoji slugs resolved to characters." code={`<Action emoji="rocket">Launch</Action>
<Action emojiTrailing="sparkles">Magic</Action>
<Action emoji="fire" emojiTrailing="100">Perfect</Action>
<Action emoji="wave">Hello</Action>`}>
        <div className="flex items-center gap-3">
          <Action emoji="rocket">Launch</Action>
          <Action emojiTrailing="sparkles">Magic</Action>
          <Action emoji="fire" emojiTrailing="100">Perfect</Action>
          <Action emoji="wave">Hello</Action>
        </div>
      </DemoSection>

      {/* Avatar & Badge */}
      <DemoSection title="Avatar & Badge" description="Avatar images and badge text." code={`<Action avatar="https://i.pravatar.cc/40?img=1">John Doe</Action>
<Action avatar="https://i.pravatar.cc/40?img=2" avatarTrailing>Jane Smith</Action>
<Action badge="3">Messages</Action>
<Action badge="New" badgeTrailing color="blue">Update</Action>
<Action avatar="https://i.pravatar.cc/40?img=3" badge="5" color="violet">Team</Action>`}>
        <div className="flex items-center gap-3">
          <Action avatar="https://i.pravatar.cc/40?img=1">John Doe</Action>
          <Action avatar="https://i.pravatar.cc/40?img=2" avatarTrailing>Jane Smith</Action>
          <Action badge="3">Messages</Action>
          <Action badge="New" badgeTrailing color="blue">Update</Action>
          <Action avatar="https://i.pravatar.cc/40?img=3" badge="5" color="violet">Team</Action>
        </div>
      </DemoSection>

      {/* Circle Variant */}
      <DemoSection title="Circle Variant" description="Icon-only circular buttons." code={`<Action variant="circle" size="sm" icon="plus" />
<Action variant="circle" icon="pencil" />
<Action variant="circle" size="lg" icon="star" />
<Action variant="circle" color="blue" icon="check" />
<Action variant="circle" color="red" icon="bell" />
<Action variant="circle" active icon="star" />`}>
        <div className="flex items-center gap-3">
          <Action variant="circle" size="sm" icon="plus" />
          <Action variant="circle" icon="pencil" />
          <Action variant="circle" size="lg" icon="star" />
          <Action variant="circle" color="blue" icon="check" />
          <Action variant="circle" color="red" icon="bell" />
          <Action variant="circle" active icon="star" />
        </div>
      </DemoSection>

      {/* Ghost Variant */}
      <DemoSection title="Ghost Variant" description="Transparent background with subtle hover — pairs with any color." code={`<Action variant="ghost">Default</Action>
<Action variant="ghost" color="blue">Blue</Action>
<Action variant="ghost" color="emerald" icon="check">Save</Action>
<Action variant="ghost" color="red" icon="trash-2">Delete</Action>
<Action variant="ghost" color="violet" icon="sparkles">Magic</Action>
<Action variant="ghost" icon="download">Export</Action>
<Action variant="ghost" active icon="star">Active</Action>
<Action variant="ghost" checked icon="check">Checked</Action>
<Action variant="ghost" warn icon="alert-triangle">Warn</Action>
<Action variant="ghost" icon="bell" badge="3">Alerts</Action>
<Action variant="ghost" disabled>Disabled</Action>`}>
        <div className="flex flex-wrap items-center gap-3">
          <Action variant="ghost">Default</Action>
          <Action variant="ghost" color="blue">Blue</Action>
          <Action variant="ghost" color="emerald" icon="check">Save</Action>
          <Action variant="ghost" color="red" icon="trash-2">Delete</Action>
          <Action variant="ghost" color="violet" icon="sparkles">Magic</Action>
          <Action variant="ghost" icon="download">Export</Action>
          <Action variant="ghost" active icon="star">Active</Action>
          <Action variant="ghost" checked icon="check">Checked</Action>
          <Action variant="ghost" warn icon="alert-triangle">Warn</Action>
          <Action variant="ghost" icon="bell" badge="3">Alerts</Action>
          <Action variant="ghost" disabled>Disabled</Action>
        </div>
      </DemoSection>

      {/* Sort Control */}
      <DemoSection title="Sort Control" description="Custom element ordering with sort prop." code={`<Action emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3">Default (eiab)</Action>
<Action emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="biae">Sort: biae</Action>
<Action emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="abie">Sort: abie</Action>`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Action emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3">Default (eiab)</Action>
            <Action emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="biae">Sort: biae</Action>
            <Action emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="abie">Sort: abie</Action>
          </div>
        </div>
      </DemoSection>

      {/* Disabled State */}
      <DemoSection title="Disabled State" description="Disabled buttons with reduced opacity." code={`<Action disabled>Disabled</Action>
<Action disabled color="blue">Disabled Blue</Action>
<Action disabled active>Disabled Active</Action>`}>
        <div className="flex items-center gap-3">
          <Action disabled>Disabled</Action>
          <Action disabled color="blue">Disabled Blue</Action>
          <Action disabled active>Disabled Active</Action>
        </div>
      </DemoSection>

      {/* Loading State */}
      <DemoSection title="Loading State" description="Spinner replaces the icon while loading." code={`<Action loading>Saving...</Action>
<Action loading color="blue">Processing</Action>
<Action loading variant="circle" />`}>
        <div className="flex items-center gap-3">
          <Action loading>Saving...</Action>
          <Action loading color="blue">Processing</Action>
          <Action loading variant="circle" />
        </div>
      </DemoSection>

      {/* As Link */}
      <DemoSection title="As Link" description="Rendered as an anchor tag." code={`<Action href="https://example.com">Visit Example</Action>
<Action href="https://example.com" color="blue" icon="chevron-right" iconPlace="right">
  Go to Site
</Action>`}>
        <div className="flex items-center gap-3">
          <Action href="https://example.com">Visit Example</Action>
          <Action href="https://example.com" color="blue" icon="chevron-right" iconPlace="right">
            Go to Site
          </Action>
        </div>
      </DemoSection>

      {/* Toolbar Example */}
      <DemoSection title="Toolbar Example" description="Formatting toolbar with active state toggles." code={`<Action variant="circle" active icon="bold" size="sm" />
<Action variant="circle" icon="italic" size="sm" />
<Action variant="circle" icon="underline" size="sm" />`}>
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 gap-1 bg-zinc-50 dark:bg-zinc-800">
          <Action variant="circle" active icon="bold" size="sm" />
          <Action variant="circle" icon="italic" size="sm" />
          <Action variant="circle" icon="underline" size="sm" />
        </div>
      </DemoSection>
    </div>
  );
}
