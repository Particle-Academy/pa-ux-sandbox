export interface DemoEntry {
  name: string;
  slug: string;
  description: string;
  package: "react";
  category: "component" | "pattern";
  external?: boolean;
  externalUrl?: string;
}

export const reactDemos: DemoEntry[] = [
  { name: "Action", slug: "action", description: "Buttons, links, and interactive action elements", package: "react", category: "component" },
  { name: "Carousel", slug: "carousel", description: "Compound carousel with slides, controls, and steps", package: "react", category: "component" },
  { name: "ColorPicker", slug: "color-picker", description: "HSL color picker with swatches and input", package: "react", category: "component" },
  { name: "Emoji", slug: "emoji", description: "Render emojis by name with size variants", package: "react", category: "component" },
  { name: "EmojiSelect", slug: "emoji-select", description: "Searchable emoji picker with categories", package: "react", category: "component" },
  { name: "Inputs", slug: "inputs", description: "Form inputs with dirty state, validation, and range modes", package: "react", category: "component" },
  { name: "Table", slug: "table", description: "Data table with sorting, pagination, and search", package: "react", category: "component" },
  { name: "Wizard Form", slug: "wizard", description: "Multi-step form wizard built on Carousel", package: "react", category: "pattern" },
  { name: "Nested Carousel", slug: "nested-carousel", description: "Independent carousels nested inside each other", package: "react", category: "pattern" },
  { name: "Dynamic Carousel", slug: "dynamic-carousel", description: "Add and remove slides dynamically at runtime", package: "react", category: "pattern" },
  { name: "AppSheet", slug: "app-sheet", description: "Budget tracker micro-app built with Spreadsheet components", package: "react", category: "pattern" },
];
