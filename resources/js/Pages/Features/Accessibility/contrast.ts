/*
 * WCAG 2.x contrast, computed the way the spec defines it, plus the browser
 * half that turns a rendered element's colours into sRGB bytes.
 *
 * The pure functions are unit-tested (tests/js/features-accessibility.test.ts)
 * against ratios the react-fancy changelog quotes. The browser half resolves
 * ANY CSS colour (oklch, color-mix, rgb) by painting it on a 1x1 canvas and
 * reading the pixel back, so the page measures what the browser actually
 * draws rather than parsing colour syntax itself.
 */

export type Rgb = [number, number, number];
export type Rgba = [number, number, number, number];

/** WCAG relative luminance of an sRGB triple (0-255 per channel). */
export function relativeLuminance([r, g, b]: Rgb): number {
    const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1 to 21. Order does not matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `#rrggbb` to a triple. */
export function hexToRgb(hex: string): Rgb {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

/** Paint `top` (with its alpha, 0-1) over an opaque `bottom`. */
export function composite(top: Rgba, bottom: Rgb): Rgb {
    const a = top[3];
    return [0, 1, 2].map((i) => Math.round(top[i] * a + bottom[i] * (1 - a))) as Rgb;
}

/** Formats a ratio the way WCAG states thresholds: two decimals, then ":1". */
export function formatRatio(ratio: number): string {
    return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

let canvasContext: CanvasRenderingContext2D | null | undefined;

/** Any CSS colour, as the browser paints it: sRGB bytes plus alpha (0-1). Null when it cannot. */
export function resolveColor(css: string): Rgba | null {
    if (typeof document === "undefined") {
        return null;
    }
    if (canvasContext === undefined) {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        canvasContext = canvas.getContext("2d", { willReadFrequently: true });
    }
    const ctx = canvasContext;
    if (!ctx) {
        return null;
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
}

/**
 * The opaque colour behind an element: its own background, composited over
 * each ancestor's until one is opaque (the page itself when none is).
 */
export function backgroundBehind(el: Element): Rgb | null {
    const layers: Rgba[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) {
        const color = resolveColor(getComputedStyle(node).backgroundColor);
        if (color === null) {
            return null;
        }
        if (color[3] > 0) {
            layers.push(color);
            if (color[3] >= 1) {
                break;
            }
        }
    }
    let base: Rgb = layers.length > 0 && layers[layers.length - 1][3] >= 1 ? (layers.pop()!.slice(0, 3) as Rgb) : [255, 255, 255];
    while (layers.length > 0) {
        base = composite(layers.pop()!, base);
    }
    return base;
}

/** A foreground colour (border, text) painted over what is behind `against`. */
export function measureAgainst(foregroundCss: string, against: Element): number | null {
    const fg = resolveColor(foregroundCss);
    const bg = backgroundBehind(against);
    if (fg === null || bg === null) {
        return null;
    }
    return contrastRatio(composite(fg, bg), bg);
}
