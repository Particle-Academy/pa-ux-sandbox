import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

/** The canonical kind id. Namespaced, and what gets written into documents. */
export const UI_EFFECT_KIND = "@particle-academy/ui_effect";

/**
 * `ui_effect` — change how a running surface looks, from a workflow.
 *
 * Six operations cover the ground: add / remove / toggle / replace a class, set
 * a CSS custom property, set an inline style. `durationMs` reverts afterwards,
 * which is what turns those six into pulses, flashes and glows without a
 * separate "animation" concept nobody can extend.
 *
 * Two things it deliberately does NOT do:
 *
 *  - It doesn't ship animations. `add-class` + your own CSS beats a fixed menu
 *    of presets, and the optional stylesheet (`./effects.css`) is a convenience,
 *    not a dependency.
 *  - It doesn't touch the DOM itself. See `./types` — the node resolves an
 *    intent and a host applies it, so the same graph works in a browser, behind
 *    a relay, or in a test.
 */
export const uiEffectKind: NodeKindDefinition = {
  name: UI_EFFECT_KIND,
  aliases: ["ui_effect"],
  category: "io",
  label: "UI Effect",
  description: "Add, swap or remove a class, set a CSS variable, or flash a style on a live surface.",
  icon: "✨",
  accent: "#a855f7",

  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],

  configSchema: [
    {
      key: "target",
      label: "Target",
      type: "text",
      required: true,
      default: "page",
      placeholder: "page, or a stable handle",
      description:
        "`page` for the whole document (where theme changes go), or a stable handle the surface published. Handles, not guessed selectors.",
    },
    {
      key: "op",
      label: "Operation",
      type: "select",
      required: true,
      options: [
        { value: "add-class", label: "Add class" },
        { value: "remove-class", label: "Remove class" },
        { value: "toggle-class", label: "Toggle class" },
        { value: "replace-class", label: "Replace class" },
        { value: "set-var", label: "Set CSS variable" },
        { value: "set-style", label: "Set inline style" },
      ],
      default: "add-class",
    },
    {
      key: "value",
      label: "Value",
      type: "text",
      required: true,
      placeholder: "ff-fx-glow  ·  #a855f7  ·  0 0 24px rgba(168,85,247,.6)",
      description: "The class list to apply, or the CSS value to set.",
    },
    {
      key: "name",
      label: "Property / class to replace",
      type: "text",
      placeholder: "--fa-accent  ·  box-shadow  ·  theme-light",
      description:
        "The custom property for Set CSS variable, the CSS property for Set inline style, or the class being replaced.",
    },
    {
      key: "durationMs",
      label: "Revert after (ms)",
      type: "number",
      min: 0,
      step: 100,
      default: 0,
      description: "0 keeps the change. Any other value puts it back afterwards — this is how you pulse.",
    },
  ],

  defaultConfig: {
    target: "page",
    op: "add-class",
    value: "",
    name: "",
    durationMs: 0,
  },
};
