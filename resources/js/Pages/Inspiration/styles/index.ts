import type { ComponentType } from "react";
import type { Style } from "../types";
import Swiss from "./Swiss";
import Dark from "./dark";
import Editorial from "./editorial";
import Product from "./product";
import Bento from "./bento";
import Gradient from "./gradient";
import Mono from "./mono";
import BigType from "./bigtype";
import Terminal from "./terminal";
import Shell from "./shell";
import Broken from "./broken";
import Sheet from "./sheet";
import Kinetic from "./kinetic";
import Brutalist from "./brutalist";
import NeoBrutal from "./neobrutal";
import Whiteboard from "./whiteboard";
import Retro from "./retro";
import Cursor from "./cursor";
import Cobrowse from "./cobrowse";
import Agentic from "./agentic";

/**
 * The style-mounting registry — the pattern every built gallery style follows.
 *
 * Each of the 20 FIELDWORK styles lives in its own component under this folder
 * and registers here, keyed by the `style.id` from App\Support\GalleryRegistry.
 * Inspiration/Show.tsx looks the id up in this map: a hit mounts the bespoke,
 * full-bleed style page; a miss falls back to the "in progress" placeholder.
 *
 * Imports are STATIC (not React.lazy): each style must server-render under
 * Inertia SSR — a lazy() component renders its Suspense fallback during SSR,
 * leaving the page contentless + flashing on hydrate. Each `<id>.tsx` imports
 * its own scoped `./<id>.css`, so styles stay self-contained.
 */
export type StyleComponent = ComponentType<{ style: Style }>;

export const STYLE_COMPONENTS: Record<string, StyleComponent> = {
    swiss: Swiss,
    dark: Dark,
    editorial: Editorial,
    product: Product,
    bento: Bento,
    gradient: Gradient,
    mono: Mono,
    bigtype: BigType,
    terminal: Terminal,
    shell: Shell,
    broken: Broken,
    sheet: Sheet,
    kinetic: Kinetic,
    brutalist: Brutalist,
    neobrutal: NeoBrutal,
    whiteboard: Whiteboard,
    retro: Retro,
    cursor: Cursor,
    cobrowse: Cobrowse,
    agentic: Agentic,
};
