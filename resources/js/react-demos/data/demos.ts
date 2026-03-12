export interface DemoEntry {
  name: string;
  slug: string;
  description: string;
  package: "react" | "livewire";
  category: "component" | "pattern";
  external?: boolean;
  externalUrl?: string;
  counterpart?: boolean;
}

export const reactDemos: DemoEntry[] = [
  { name: "Action", slug: "action", description: "Buttons, links, and interactive action elements", package: "react", category: "component", counterpart: true },
  { name: "Carousel", slug: "carousel", description: "Compound carousel with slides, controls, and steps", package: "react", category: "component", counterpart: true },
  { name: "ColorPicker", slug: "color-picker", description: "HSL color picker with swatches and input", package: "react", category: "component", counterpart: true },
  { name: "Emoji", slug: "emoji", description: "Render emojis by name with size variants", package: "react", category: "component" },
  { name: "EmojiSelect", slug: "emoji-select", description: "Searchable emoji picker with categories", package: "react", category: "component", counterpart: true },
  { name: "Inputs", slug: "inputs", description: "Form inputs with dirty state, validation, and range modes", package: "react", category: "component" },
  { name: "Table", slug: "table", description: "Data table with sorting, pagination, and search", package: "react", category: "component" },
  { name: "Wizard Form", slug: "wizard", description: "Multi-step form wizard built on Carousel", package: "react", category: "pattern", counterpart: true },
  { name: "Nested Carousel", slug: "nested-carousel", description: "Independent carousels nested inside each other", package: "react", category: "pattern", counterpart: true },
  { name: "Dynamic Carousel", slug: "dynamic-carousel", description: "Add and remove slides dynamically at runtime", package: "react", category: "pattern", counterpart: true },
];

export const livewireDemos: DemoEntry[] = [
  { name: "Action", slug: "action-examples", description: "Buttons, links, and interactive action elements", package: "livewire", category: "component", externalUrl: "/fancy-flux-demos/action-examples", counterpart: true },
  { name: "Carousel", slug: "basic-carousel", description: "Flux carousel with variants and autoplay", package: "livewire", category: "component", externalUrl: "/fancy-flux-demos/basic-carousel", counterpart: true },
  { name: "ColorPicker", slug: "color-picker-examples", description: "HSL color picker with Livewire binding", package: "livewire", category: "component", externalUrl: "/fancy-flux-demos/color-picker-examples", counterpart: true },
  { name: "EmojiSelect", slug: "emoji-select-examples", description: "Searchable emoji picker component", package: "livewire", category: "component", externalUrl: "/fancy-flux-demos/emoji-select-examples", counterpart: true },
  { name: "Wizard Form", slug: "wizard-form", description: "Multi-step wizard with validation and modals", package: "livewire", category: "pattern", externalUrl: "/fancy-flux-demos/wizard-form", counterpart: true },
  { name: "Nested Carousel", slug: "nested-carousel", description: "Parent-child carousels with advancement", package: "livewire", category: "pattern", externalUrl: "/fancy-flux-demos/nested-carousel", counterpart: true },
  { name: "Dynamic Carousel", slug: "dynamic-carousel", description: "Dynamic slides and headless agent workflow", package: "livewire", category: "pattern", externalUrl: "/fancy-flux-demos/dynamic-carousel", counterpart: true },
];
