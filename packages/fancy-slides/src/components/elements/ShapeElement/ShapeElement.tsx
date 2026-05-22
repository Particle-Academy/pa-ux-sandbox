import type { ShapeElement, Theme } from "../../../types";
import { resolveTheme } from "../../../theme/theme-utils";

export interface ShapeElementRendererProps {
    element: ShapeElement;
    theme?: Theme;
    slideWidthPx: number;
}

/**
 * SVG-rendered shape primitive. Sized to fill its element box; the box
 * decides world position via the parent Slide's positioning wrapper.
 */
export function ShapeElementRenderer({ element, theme, slideWidthPx }: ShapeElementRendererProps) {
    const t = resolveTheme(theme);
    const designWidth = t.slideWidth ?? 1920;
    const scale = slideWidthPx / designWidth;

    const fill = element.fill ?? "rgba(139, 92, 246, 0.15)";
    const stroke = element.stroke ?? t.colors?.accent ?? "#8b5cf6";
    const strokeWidth = (element.strokeWidth ?? 2) * scale;
    const dasharray = element.dashed ? `${6 * scale} ${4 * scale}` : undefined;

    // SVG uses a 0..100 viewBox so radius/strokeWidth are in box-relative units
    // and resolution-independent at render time.
    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
        >
            {renderShape(element, { fill, stroke, strokeWidth, dasharray })}
        </svg>
    );
}

interface ShapeStyle {
    fill: string;
    stroke: string;
    strokeWidth: number;
    dasharray?: string;
}

function renderShape(el: ShapeElement, s: ShapeStyle) {
    const common = {
        fill: s.fill,
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
        strokeDasharray: s.dasharray,
    };
    switch (el.shape) {
        case "rect":
            return <rect x="0" y="0" width="100" height="100" {...common} />;
        case "rounded-rect": {
            const r = el.radius ?? 8;
            return <rect x="0" y="0" width="100" height="100" rx={r} ry={r} {...common} />;
        }
        case "ellipse":
            return <ellipse cx="50" cy="50" rx="50" ry="50" {...common} />;
        case "triangle":
            return <polygon points="50,0 100,100 0,100" {...common} />;
        case "line":
            return <line x1="0" y1="50" x2="100" y2="50" {...common} fill="none" />;
        case "arrow":
            return (
                <g>
                    <defs>
                        <marker id={`arrow-${el.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill={s.stroke} />
                        </marker>
                    </defs>
                    <line x1="0" y1="50" x2="100" y2="50" {...common} fill="none" markerEnd={`url(#arrow-${el.id})`} />
                </g>
            );
        default:
            return null;
    }
}
