import type { ComponentType } from "react";
import type { Style } from "../types";
import { FIELDWORK_STYLES } from "./fieldwork";
import { MOM_N_POPS_STYLES } from "./mom-n-pops";

/**
 * The style-mounting registry — collection → style id → component.
 *
 * Each collection is one fictional business designed twenty ways; every style
 * lives in its own component under ./{collection}/ and registers in that
 * collection's index (FIELDWORK_STYLES / MOM_N_POPS_STYLES). Inspiration/Show
 * looks up STYLE_COMPONENTS[collection]?.[style.id]: a hit mounts the bespoke,
 * full-bleed style page; a miss falls back to the "in progress" placeholder.
 *
 * Imports are STATIC (not React.lazy): each style must server-render under
 * Inertia SSR — a lazy() component renders its Suspense fallback during SSR,
 * leaving the page contentless + flashing on hydrate. Each `<id>.tsx` imports
 * its own scoped `./<id>.css`, so styles stay self-contained.
 */
export type StyleComponent = ComponentType<{ style: Style }>;

export const STYLE_COMPONENTS: Record<string, Record<string, StyleComponent>> = {
    fieldwork: FIELDWORK_STYLES,
    "mom-n-pops": MOM_N_POPS_STYLES,
};
