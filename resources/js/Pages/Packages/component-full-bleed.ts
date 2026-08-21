/**
 * Which component previews get the full width of the card.
 *
 * Its own module rather than living in `ComponentDemo.tsx`, because that one
 * is lazy-loaded through `clientOnly` -- importing a helper out of it would
 * pull every demo in the suite into the page bundle to answer a boolean.
 */

/**
 * Demos whose surface SIZES ITSELF TO ITS CONTAINER rather than to its content
 * — a canvas, a map's tile layer, a graph viewport, a WebGL stage.
 *
 * Every other demo is content that wants breathing room, so the preview card
 * pads it. A canvas is the opposite: the padding is not framing the drawing, it
 * is SHRINKING it. `fancy-whiteboard/drawing` was the case that showed it —
 * a pen surface rendered into a box inset from a box, with the usable area
 * noticeably smaller than the space available for it.
 *
 * Kept beside REGISTRY on purpose. A list of canvas components in another file
 * is one that silently disagrees with this one the first time a demo is renamed;
 * `component-preview.test.ts` asserts every key here still resolves to a demo.
 */
const FULL_BLEED = new Set<string>([
    // Whiteboard — every surface renders onto the board canvas.
    "fancy-whiteboard/board",
    "fancy-whiteboard/drawing",
    "fancy-whiteboard/shape",
    "fancy-whiteboard/connector",
    "fancy-whiteboard/cursor-layer",
    "fancy-whiteboard/sticky-note",
    "agent-integrations/shared-whiteboard",

    // Artboard — a pan/zoom design canvas.
    "fancy-artboard/artboard",
    "fancy-artboard/art-piece",
    "fancy-artboard/artboard-section",
    "fancy-artboard/artboard-note",

    // Flow — a React Flow viewport.
    "fancy-flow/flow-editor",
    "fancy-flow/flow-viewer",
    "fancy-flow/flow-runner-ux",

    // 3D — a WebGL / DOM-3D stage.
    "fancy-3d/canvas",
    "fancy-3d-babylon/stage",
    "fancy-3d-babylon/monitor",
    "fancy-3d-babylon/card-3d",
    "fancy-3d-three/stage",
    "fancy-3d-three/monitor",
    "fancy-3d-three/card-3d",

    // Charts and maps size to the box they are given.
    "fancy-echarts/echart",
    "fancy-map/map",
]);

/**
 * Does this component's preview want the full width of the card?
 *
 * Resolves the same way {@link ComponentDemo} does, including the
 * package-qualified fallback — otherwise a component the registry qualifies
 * (`react-fancy-sticky-note`) would miss.
 */
export function demoIsFullBleed(pkg: string, slug: string): boolean {
    if (FULL_BLEED.has(`${pkg}/${slug}`)) return true;

    return slug.startsWith(`${pkg}-`) && FULL_BLEED.has(`${pkg}/${slug.slice(pkg.length + 1)}`);
}

/** Every key in {@link FULL_BLEED}, for the drift test. */
export const FULL_BLEED_KEYS: readonly string[] = [...FULL_BLEED];
