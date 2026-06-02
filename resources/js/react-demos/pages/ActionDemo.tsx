import { Button } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ActionDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Action</h1>

      {/* State Variants */}
      <DemoSection title="State Variants" description="Default, active, checked, and warn states." code={`<Button>Default</Button>
<Button active>Active</Button>
<Button checked>Checked</Button>
<Button warn>Warn</Button>`}>
        <div className="flex items-center gap-3">
          <Button>Default</Button>
          <Button active>Active</Button>
          <Button checked>Checked</Button>
          <Button warn>Warn</Button>
        </div>
      </DemoSection>

      {/* Alert Animation */}
      <DemoSection title="Alert Animation" description="Pulse animation on various states." code={`<Button alert>Default Alert</Button>
<Button active alert>Active Alert</Button>
<Button warn alert>Warn Alert</Button>`}>
        <div className="flex items-center gap-3">
          <Button alert>Default Alert</Button>
          <Button active alert>Active Alert</Button>
          <Button warn alert>Warn Alert</Button>
        </div>
      </DemoSection>

      {/* Size Variants */}
      <DemoSection title="Size Variants" description="Five size options from xs to xl." code={`<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>`}>
        <div className="flex items-center gap-3">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </DemoSection>

      {/* Standalone Colors */}
      <DemoSection title="Standalone Colors" description="All 10 standalone color options." code={`<Button color="blue">Blue</Button>
<Button color="emerald">Emerald</Button>
<Button color="amber">Amber</Button>
<Button color="red">Red</Button>
<Button color="violet">Violet</Button>
<Button color="indigo">Indigo</Button>
<Button color="sky">Sky</Button>
<Button color="rose">Rose</Button>
<Button color="orange">Orange</Button>
<Button color="zinc">Zinc</Button>`}>
        <div className="flex flex-wrap items-center gap-3">
          <Button color="blue">Blue</Button>
          <Button color="emerald">Emerald</Button>
          <Button color="amber">Amber</Button>
          <Button color="red">Red</Button>
          <Button color="violet">Violet</Button>
          <Button color="indigo">Indigo</Button>
          <Button color="sky">Sky</Button>
          <Button color="rose">Rose</Button>
          <Button color="orange">Orange</Button>
          <Button color="zinc">Zinc</Button>
        </div>
      </DemoSection>

      {/* With Icons */}
      <DemoSection title="With Icons" description="Icon placement: left, right, top, bottom." code={`<Button icon="pencil">Edit</Button>
<Button icon="chevron-right" iconPlace="right">Next</Button>
<Button iconTrailing="chevron-right">Continue</Button>
<Button icon="arrow-up" iconPlace="top">Upload</Button>
<Button icon="star" iconPlace="bottom">Star</Button>`}>
        <div className="flex items-end gap-3">
          <Button icon="pencil">Edit</Button>
          <Button icon="chevron-right" iconPlace="right">Next</Button>
          <Button iconTrailing="chevron-right">Continue</Button>
          <Button icon="arrow-up" iconPlace="top">Upload</Button>
          <Button icon="star" iconPlace="bottom">Star</Button>
        </div>
      </DemoSection>

      {/* Alert Icons */}
      <DemoSection title="Alert Icons" description="Pulsing alert icons with ping animation." code={`<Button alertIcon="bell">Notifications</Button>
<Button alertIcon="bell" alertIconTrailing>Alerts</Button>
<Button color="red" alertIcon="bell">Urgent</Button>`}>
        <div className="flex items-center gap-3">
          <Button alertIcon="bell">Notifications</Button>
          <Button alertIcon="bell" alertIconTrailing>Alerts</Button>
          <Button color="red" alertIcon="bell">Urgent</Button>
        </div>
      </DemoSection>

      {/* Emoji Support */}
      <DemoSection title="Emoji Support" description="Emoji slugs resolved to characters." code={`<Button emoji="rocket">Launch</Button>
<Button emojiTrailing="sparkles">Magic</Button>
<Button emoji="fire" emojiTrailing="100">Perfect</Button>
<Button emoji="wave">Hello</Button>`}>
        <div className="flex items-center gap-3">
          <Button emoji="rocket">Launch</Button>
          <Button emojiTrailing="sparkles">Magic</Button>
          <Button emoji="fire" emojiTrailing="100">Perfect</Button>
          <Button emoji="wave">Hello</Button>
        </div>
      </DemoSection>

      {/* Avatar & Badge */}
      <DemoSection title="Avatar & Badge" description="Avatar images and badge text." code={`<Button avatar="https://i.pravatar.cc/40?img=1">John Doe</Button>
<Button avatar="https://i.pravatar.cc/40?img=2" avatarTrailing>Jane Smith</Button>
<Button badge="3">Messages</Button>
<Button badge="New" badgeTrailing color="blue">Update</Button>
<Button avatar="https://i.pravatar.cc/40?img=3" badge="5" color="violet">Team</Button>`}>
        <div className="flex items-center gap-3">
          <Button avatar="https://i.pravatar.cc/40?img=1">John Doe</Button>
          <Button avatar="https://i.pravatar.cc/40?img=2" avatarTrailing>Jane Smith</Button>
          <Button badge="3">Messages</Button>
          <Button badge="New" badgeTrailing color="blue">Update</Button>
          <Button avatar="https://i.pravatar.cc/40?img=3" badge="5" color="violet">Team</Button>
        </div>
      </DemoSection>

      {/* Circle Variant */}
      <DemoSection title="Circle Variant" description="Icon-only circular buttons." code={`<Button variant="circle" size="sm" icon="plus" />
<Button variant="circle" icon="pencil" />
<Button variant="circle" size="lg" icon="star" />
<Button variant="circle" color="blue" icon="check" />
<Button variant="circle" color="red" icon="bell" />
<Button variant="circle" active icon="star" />`}>
        <div className="flex items-center gap-3">
          <Button variant="circle" size="sm" icon="plus" />
          <Button variant="circle" icon="pencil" />
          <Button variant="circle" size="lg" icon="star" />
          <Button variant="circle" color="blue" icon="check" />
          <Button variant="circle" color="red" icon="bell" />
          <Button variant="circle" active icon="star" />
        </div>
      </DemoSection>

      {/* Ghost Variant */}
      <DemoSection title="Ghost Variant" description="Transparent background with subtle hover — pairs with any color." code={`<Button variant="ghost">Default</Button>
<Button variant="ghost" color="blue">Blue</Button>
<Button variant="ghost" color="emerald" icon="check">Save</Button>
<Button variant="ghost" color="red" icon="trash-2">Delete</Button>
<Button variant="ghost" color="violet" icon="sparkles">Magic</Button>
<Button variant="ghost" icon="download">Export</Button>
<Button variant="ghost" active icon="star">Active</Button>
<Button variant="ghost" checked icon="check">Checked</Button>
<Button variant="ghost" warn icon="alert-triangle">Warn</Button>
<Button variant="ghost" icon="bell" badge="3">Alerts</Button>
<Button variant="ghost" disabled>Disabled</Button>`}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost">Default</Button>
          <Button variant="ghost" color="blue">Blue</Button>
          <Button variant="ghost" color="emerald" icon="check">Save</Button>
          <Button variant="ghost" color="red" icon="trash-2">Delete</Button>
          <Button variant="ghost" color="violet" icon="sparkles">Magic</Button>
          <Button variant="ghost" icon="download">Export</Button>
          <Button variant="ghost" active icon="star">Active</Button>
          <Button variant="ghost" checked icon="check">Checked</Button>
          <Button variant="ghost" warn icon="alert-triangle">Warn</Button>
          <Button variant="ghost" icon="bell" badge="3">Alerts</Button>
          <Button variant="ghost" disabled>Disabled</Button>
        </div>
      </DemoSection>

      {/* Sort Control */}
      <DemoSection title="Sort Control" description="Custom element ordering with sort prop." code={`<Button emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3">Default (eiab)</Button>
<Button emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="biae">Sort: biae</Button>
<Button emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="abie">Sort: abie</Button>`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Button emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3">Default (eiab)</Button>
            <Button emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="biae">Sort: biae</Button>
            <Button emoji="star" icon="pencil" avatar="https://i.pravatar.cc/40?img=5" badge="3" sort="abie">Sort: abie</Button>
          </div>
        </div>
      </DemoSection>

      {/* Disabled State */}
      <DemoSection title="Disabled State" description="Disabled buttons with reduced opacity." code={`<Button disabled>Disabled</Button>
<Button disabled color="blue">Disabled Blue</Button>
<Button disabled active>Disabled Active</Button>`}>
        <div className="flex items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button disabled color="blue">Disabled Blue</Button>
          <Button disabled active>Disabled Active</Button>
        </div>
      </DemoSection>

      {/* Loading State */}
      <DemoSection title="Loading State" description="Spinner replaces the icon while loading." code={`<Button loading>Saving...</Button>
<Button loading color="blue">Processing</Button>
<Button loading variant="circle" />`}>
        <div className="flex items-center gap-3">
          <Button loading>Saving...</Button>
          <Button loading color="blue">Processing</Button>
          <Button loading variant="circle" />
        </div>
      </DemoSection>

      {/* As Link */}
      <DemoSection title="As Link" description="Rendered as an anchor tag." code={`<Button href="https://example.com">Visit Example</Button>
<Button href="https://example.com" color="blue" icon="chevron-right" iconPlace="right">
  Go to Site
</Button>`}>
        <div className="flex items-center gap-3">
          <Button href="https://example.com">Visit Example</Button>
          <Button href="https://example.com" color="blue" icon="chevron-right" iconPlace="right">
            Go to Site
          </Button>
        </div>
      </DemoSection>

      {/* Toolbar Example */}
      <DemoSection title="Toolbar Example" description="Formatting toolbar with active state toggles." code={`<Button variant="circle" active icon="bold" size="sm" />
<Button variant="circle" icon="italic" size="sm" />
<Button variant="circle" icon="underline" size="sm" />`}>
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 gap-1 bg-zinc-50 dark:bg-zinc-800">
          <Button variant="circle" active icon="bold" size="sm" />
          <Button variant="circle" icon="italic" size="sm" />
          <Button variant="circle" icon="underline" size="sm" />
        </div>
      </DemoSection>
    </div>
  );
}
