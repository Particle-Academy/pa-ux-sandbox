/**
 * Schema registry for the Agent Playground "composition" screen kind.
 *
 * A `composition` screen renders agent-emitted JSON (`ScreenSchema`) through
 * fancy-screens' `<Screen schema>` mode. This module maps schema `type` names
 * to react-fancy (and fancy-artboard) components so an agent can author an
 * entire Fancy UI page as JSON via `screens_update_content`.
 *
 * Call `ensureSchemaComponents()` once before any composition screen mounts.
 */
import type { ComponentType } from "react";
import {
  Accordion,
  AccordionPanel,
  Button,
  Avatar,
  Badge,
  Callout,
  Card,
  Checkbox,
  Heading,
  Input,
  Progress,
  RadioGroup,
  Select,
  Separator,
  Slider,
  StickyNote,
  Switch,
  Table,
  Tabs,
  Text,
  Textarea,
  Timeline,
} from "@particle-academy/react-fancy";
import { registerSchemaComponents } from "@particle-academy/fancy-screens";
import { registerArtboardSchema } from "@particle-academy/fancy-artboard/screens";

let done = false;

/**
 * Idempotently register the full schema component map. The registry is a
 * module-level singleton inside fancy-screens, so registering twice is
 * harmless, but we guard anyway to keep things tidy.
 */
export function ensureSchemaComponents(): void {
  if (done) return;
  done = true;

  const map: Record<string, ComponentType<Record<string, unknown>>> = {
    // Layout / containers
    Card: Card as unknown as ComponentType<Record<string, unknown>>,
    "Card.Body": Card.Body as unknown as ComponentType<Record<string, unknown>>,
    "Card.Header": Card.Header as unknown as ComponentType<Record<string, unknown>>,
    "Card.Footer": Card.Footer as unknown as ComponentType<Record<string, unknown>>,
    Separator: Separator as unknown as ComponentType<Record<string, unknown>>,
    Tabs: Tabs as unknown as ComponentType<Record<string, unknown>>,
    Accordion: Accordion as unknown as ComponentType<Record<string, unknown>>,
    AccordionPanel: AccordionPanel as unknown as ComponentType<Record<string, unknown>>,

    // Typography
    Heading: Heading as unknown as ComponentType<Record<string, unknown>>,
    Text: Text as unknown as ComponentType<Record<string, unknown>>,

    // Actions / status
    Action: Action as unknown as ComponentType<Record<string, unknown>>,
    Badge: Badge as unknown as ComponentType<Record<string, unknown>>,
    Callout: Callout as unknown as ComponentType<Record<string, unknown>>,
    Progress: Progress as unknown as ComponentType<Record<string, unknown>>,
    Avatar: Avatar as unknown as ComponentType<Record<string, unknown>>,
    Timeline: Timeline as unknown as ComponentType<Record<string, unknown>>,
    StickyNote: StickyNote as unknown as ComponentType<Record<string, unknown>>,

    // Inputs (controlled — agent emits value props)
    Input: Input as unknown as ComponentType<Record<string, unknown>>,
    Textarea: Textarea as unknown as ComponentType<Record<string, unknown>>,
    Select: Select as unknown as ComponentType<Record<string, unknown>>,
    Switch: Switch as unknown as ComponentType<Record<string, unknown>>,
    Checkbox: Checkbox as unknown as ComponentType<Record<string, unknown>>,
    RadioGroup: RadioGroup as unknown as ComponentType<Record<string, unknown>>,
    Slider: Slider as unknown as ComponentType<Record<string, unknown>>,

    // Data
    Table: Table as unknown as ComponentType<Record<string, unknown>>,

    // Plain HTML escape hatch so an agent can wrap content without a component.
    div: ((props: Record<string, unknown>) => props.children as never) as never,
  };

  registerSchemaComponents(map);

  // Let `{ "type": "ArtBoard", ... }` nodes render inside a composition screen.
  registerArtboardSchema();
}
