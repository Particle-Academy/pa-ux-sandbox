import { Action } from "@fancy/react";
import { DemoSection } from "../components/DemoSection";

// Simple inline SVG icons for demos (no icon library dependency)
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
  </svg>
);

const BoldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M5 3a1 1 0 0 1 1-1h4.5a3.5 3.5 0 0 1 2.7 5.727A3.5 3.5 0 0 1 11.5 14H6a1 1 0 0 1-1-1V3Zm2 5.5h3.5a1.5 1.5 0 1 0 0-3H7v3Zm0 2H8.5 11.5a1.5 1.5 0 0 1 0 3H7v-3Z" clipRule="evenodd" />
  </svg>
);

const ItalicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M8 2.75A.75.75 0 0 1 8.75 2h7.5a.75.75 0 0 1 0 1.5h-3.215l-4.483 13h2.698a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3.215l4.483-13H8.75A.75.75 0 0 1 8 2.75Z" clipRule="evenodd" />
  </svg>
);

const UnderlineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M5.5 3a.75.75 0 0 1 .75.75v6.5a3.75 3.75 0 1 0 7.5 0v-6.5a.75.75 0 0 1 1.5 0v6.5a5.25 5.25 0 1 1-10.5 0v-6.5A.75.75 0 0 1 5.5 3ZM3 16.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
    <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6Z" clipRule="evenodd" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

export function ActionDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Action</h1>

      {/* State Variants */}
      <DemoSection title="State Variants" description="Default, active, checked, and warn states.">
        <div className="flex items-center gap-3">
          <Action>Default</Action>
          <Action active>Active</Action>
          <Action checked>Checked</Action>
          <Action warn>Warn</Action>
        </div>
      </DemoSection>

      {/* Alert Animation */}
      <DemoSection title="Alert Animation" description="Pulse animation on various states.">
        <div className="flex items-center gap-3">
          <Action alert>Default Alert</Action>
          <Action active alert>Active Alert</Action>
          <Action warn alert>Warn Alert</Action>
        </div>
      </DemoSection>

      {/* Size Variants */}
      <DemoSection title="Size Variants" description="Five size options from xs to xl.">
        <div className="flex items-center gap-3">
          <Action size="xs">Extra Small</Action>
          <Action size="sm">Small</Action>
          <Action size="md">Medium</Action>
          <Action size="lg">Large</Action>
          <Action size="xl">Extra Large</Action>
        </div>
      </DemoSection>

      {/* Standalone Colors */}
      <DemoSection title="Standalone Colors" description="All 10 standalone color options.">
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
      <DemoSection title="With Icons" description="Icon placement: left, right, top, bottom.">
        <div className="flex items-end gap-3">
          <Action icon={<PencilIcon />}>Edit</Action>
          <Action icon={<ChevronRightIcon />} iconPlace="right">Next</Action>
          <Action iconTrailing={<ChevronRightIcon />}>Continue</Action>
          <Action icon={<ArrowUpIcon />} iconPlace="top">Upload</Action>
          <Action icon={<StarIcon />} iconPlace="bottom">Star</Action>
        </div>
      </DemoSection>

      {/* Alert Icons */}
      <DemoSection title="Alert Icons" description="Pulsing alert icons with ping animation.">
        <div className="flex items-center gap-3">
          <Action alertIcon={<BellIcon />}>Notifications</Action>
          <Action alertIcon={<BellIcon />} alertIconTrailing>Alerts</Action>
          <Action color="red" alertIcon={<BellIcon />}>Urgent</Action>
        </div>
      </DemoSection>

      {/* Emoji Support */}
      <DemoSection title="Emoji Support" description="Emoji slugs resolved to characters.">
        <div className="flex items-center gap-3">
          <Action emoji="rocket">Launch</Action>
          <Action emojiTrailing="sparkles">Magic</Action>
          <Action emoji="fire" emojiTrailing="100">Perfect</Action>
          <Action emoji="wave">Hello</Action>
        </div>
      </DemoSection>

      {/* Avatar & Badge */}
      <DemoSection title="Avatar & Badge" description="Avatar images and badge text.">
        <div className="flex items-center gap-3">
          <Action avatar="https://i.pravatar.cc/40?img=1">John Doe</Action>
          <Action avatar="https://i.pravatar.cc/40?img=2" avatarTrailing>Jane Smith</Action>
          <Action badge="3">Messages</Action>
          <Action badge="New" badgeTrailing color="blue">Update</Action>
          <Action avatar="https://i.pravatar.cc/40?img=3" badge="5" color="violet">Team</Action>
        </div>
      </DemoSection>

      {/* Circle Variant */}
      <DemoSection title="Circle Variant" description="Icon-only circular buttons.">
        <div className="flex items-center gap-3">
          <Action variant="circle" size="sm" icon={<PlusIcon />} />
          <Action variant="circle" icon={<PencilIcon />} />
          <Action variant="circle" size="lg" icon={<StarIcon />} />
          <Action variant="circle" color="blue" icon={<CheckIcon />} />
          <Action variant="circle" color="red" icon={<BellIcon />} />
          <Action variant="circle" active icon={<StarIcon />} />
        </div>
      </DemoSection>

      {/* Sort Control */}
      <DemoSection title="Sort Control" description="Custom element ordering with sort prop.">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Action emoji="star" icon={<PencilIcon />} badge="3">Default (eiab)</Action>
            <Action emoji="star" icon={<PencilIcon />} badge="3" sort="biae">Sort: biae</Action>
            <Action emoji="star" icon={<PencilIcon />} badge="3" sort="abie">Sort: abie</Action>
          </div>
        </div>
      </DemoSection>

      {/* Disabled State */}
      <DemoSection title="Disabled State" description="Disabled buttons with reduced opacity.">
        <div className="flex items-center gap-3">
          <Action disabled>Disabled</Action>
          <Action disabled color="blue">Disabled Blue</Action>
          <Action disabled active>Disabled Active</Action>
        </div>
      </DemoSection>

      {/* Loading State */}
      <DemoSection title="Loading State" description="Spinner replaces the icon while loading.">
        <div className="flex items-center gap-3">
          <Action loading>Saving...</Action>
          <Action loading color="blue">Processing</Action>
          <Action loading variant="circle" />
        </div>
      </DemoSection>

      {/* As Link */}
      <DemoSection title="As Link" description="Rendered as an anchor tag.">
        <div className="flex items-center gap-3">
          <Action href="https://example.com">Visit Example</Action>
          <Action href="https://example.com" color="blue" icon={<ChevronRightIcon />} iconPlace="right">
            Go to Site
          </Action>
        </div>
      </DemoSection>

      {/* Toolbar Example */}
      <DemoSection title="Toolbar Example" description="Formatting toolbar with active state toggles.">
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 gap-1 bg-zinc-50 dark:bg-zinc-800">
          <Action variant="circle" active icon={<BoldIcon />} size="sm" />
          <Action variant="circle" icon={<ItalicIcon />} size="sm" />
          <Action variant="circle" icon={<UnderlineIcon />} size="sm" />
        </div>
      </DemoSection>
    </div>
  );
}
