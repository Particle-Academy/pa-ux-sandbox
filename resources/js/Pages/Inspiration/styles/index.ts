import type { ComponentType } from "react";
import type { Style } from "../types";
import Swiss from "./Swiss";

/**
 * The style-mounting registry — the pattern every built gallery style follows.
 *
 * Each of the 20 FIELDWORK styles lives in its own component under this folder
 * and registers here, keyed by the `style.id` from App\Support\GalleryRegistry.
 * Inspiration/Show.tsx looks the id up in this map: a hit mounts the bespoke,
 * full-bleed style page; a miss falls back to the "in progress" placeholder.
 *
 * To ship a new style: build `./<Name>.tsx` (default-exporting a
 * `({ style }: { style: Style }) => JSX` component), add its scoped CSS import
 * to resources/css/showcase/inspiration.css, then add one line below. Nothing
 * else in the Show shell or the controller changes.
 */
export type StyleComponent = ComponentType<{ style: Style }>;

export const STYLE_COMPONENTS: Record<string, StyleComponent> = {
    swiss: Swiss,
};
