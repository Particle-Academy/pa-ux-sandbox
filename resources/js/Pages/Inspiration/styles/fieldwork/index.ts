import type { StyleComponent } from "../index";
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
 * The FIELDWORK collection's style-mounting registry — one fictional creative
 * studio designed twenty ways, common → experimental, keyed by style id from
 * App\Support\GalleryRegistry. STATIC imports (Inertia SSR — React.lazy would
 * render its Suspense fallback server-side); each page is self-contained with
 * its co-located ./{id}.css (Swiss's stylesheet is the one legacy exception,
 * living in resources/css/showcase/styles/swiss.css).
 */
export const FIELDWORK_STYLES: Record<string, StyleComponent> = {
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
