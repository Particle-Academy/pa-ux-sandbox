/**
 * A scene whose nodes represent the project's full demo pages. Used by the
 * Babylon Desktop demo, where each panel is a "shortcut" tile to a full demo.
 */
import type { Scene } from "@particle-academy/fancy-3d";

interface DemoTile {
  name: string;
  description: string;
  path: string;
  accent: string;
  category: string;
}

const DEMOS: DemoTile[] = [
  { name: "AI Canvas Chat", path: "/ai-canvas-chat", category: "Pattern", accent: "#6366f1", description: "Right-anchored AccordionPanel flyout with full canvas + AI Brain force-graph." },
  { name: "Canvas Studio", path: "/canvas-studio", category: "Pattern", accent: "#22d3ee", description: "Hardcore Canvas demo with portable scene-data and an inspector." },
  { name: "Kitchen Sink", path: "/kitchen-sink", category: "Pattern", accent: "#f43f5e", description: "Dense single-page dashboard combining ~30 react-fancy components." },
  { name: "IDE", path: "/ide", category: "Pattern", accent: "#10b981", description: "VS Code-style shell with file tree, tabs, terminal, and panels." },
  { name: "AppSheet", path: "/app-sheet", category: "Pattern", accent: "#f59e0b", description: "Budget tracker micro-app built on top of Spreadsheet." },
  { name: "Wizard Form", path: "/wizard", category: "Pattern", accent: "#a855f7", description: "Multi-step form wizard built on Carousel with validation." },
  { name: "Nested Carousel", path: "/nested-carousel", category: "Pattern", accent: "#ec4899", description: "Independent carousels nested inside each other." },
  { name: "Dynamic Carousel", path: "/dynamic-carousel", category: "Pattern", accent: "#0ea5e9", description: "Add and remove slides at runtime." },
  { name: "Kanban", path: "/kanban", category: "Rich Content", accent: "#84cc16", description: "DnD board with WIP limits, attribute filters, column reorder." },
  { name: "Composer", path: "/composer", category: "Rich Content", accent: "#fb923c", description: "Rich text composer with toolbar and slash menu." },
  { name: "Editor", path: "/editor", category: "Rich Content", accent: "#06b6d4", description: "Block content editor with embeds and nesting." },
  { name: "Spreadsheet", path: "/spreadsheet", category: "Fancy Sheets", accent: "#facc15", description: "@particle-academy/fancy-sheets — formulas, ranges, virtualized cells." },
  { name: "Code Editor", path: "/code-editor", category: "Fancy Code", accent: "#7c3aed", description: "@particle-academy/fancy-code — Monaco-backed code editor." },
];

const TILE_W = 280;
const TILE_H = 200;
const COLS = 5;
const COL_GAP = 40;
const ROW_GAP = 40;

export const demosScene: Scene = {
  edges: [],
  nodes: DEMOS.map((d, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      id: `demo-${d.path.replace(/\//g, "")}`,
      position: { x: col * (TILE_W + COL_GAP), y: row * (TILE_H + ROW_GAP) },
      size: { w: TILE_W, h: TILE_H },
      widget: {
        kind: "demoPage" as const,
        name: d.name,
        description: d.description,
        path: d.path,
        accent: d.accent,
        category: d.category,
      },
    };
  }),
};
