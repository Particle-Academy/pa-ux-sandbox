import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Slide, SlideElement, Theme } from "../../types";
import { resolveTheme } from "../../theme/theme-utils";
import { cn } from "../../utils/cn";
import { TextElementRenderer } from "../elements/TextElement";
import { ImageElementRenderer } from "../elements/ImageElement";
import { ShapeElementRenderer } from "../elements/ShapeElement";

export interface SlideProps {
    /** The slide to render. */
    slide: Slide;
    /** Deck theme — controls fonts/colors/aspect-ratio when the slide doesn't override. */
    theme?: Theme;
    /** Pin the slide to this width in px. When omitted, the slide fills its container with auto-resize. */
    width?: number;
    /** Aspect ratio override — falls back to theme.aspectRatio. */
    aspectRatio?: number;
    /** Edit mode flag — passed to element renderers. */
    editing?: boolean;
    /** Called when a text element's content is edited (only in editing mode). */
    onElementContentChange?: (elementId: string, content: string) => void;
    /** Called when an element is clicked — host-driven selection. */
    onElementSelect?: (elementId: string | null) => void;
    /** Selected element id — adds a focus ring. */
    selectedElementId?: string | null;
    /** Optional override renderer for a custom element type (or to replace one of the built-ins). */
    renderElement?: (element: SlideElement, slideWidthPx: number) => ReactNode | undefined;
    className?: string;
    style?: CSSProperties;
}

/**
 * Slide — the shared renderer. Used by SlideViewer, DeckEditor canvas,
 * SlideThumbnail, and the agent bridge's preview tools. All resolution-
 * independence lives here: child elements get a `slideWidthPx` so they can
 * scale font sizes / stroke widths to the rendered slide size.
 */
export function Slide({
    slide,
    theme,
    width,
    aspectRatio,
    editing = false,
    onElementContentChange,
    onElementSelect,
    selectedElementId,
    renderElement,
    className,
    style,
}: SlideProps) {
    const t = resolveTheme(theme);
    const ratio = aspectRatio ?? t.aspectRatio ?? 16 / 9;
    const ref = useRef<HTMLDivElement>(null);
    const [measured, setMeasured] = useState<number>(width ?? 0);

    // Auto-measure when width isn't pinned.
    useEffect(() => {
        if (width !== undefined) {
            setMeasured(width);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                setMeasured(e.contentRect.width);
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [width]);

    const slideWidthPx = measured || 1;
    const slideHeightPx = slideWidthPx / ratio;

    const bg = slide.background;
    const backgroundStyle: CSSProperties = {
        background: bg?.gradient
            ? bg.gradient
            : bg?.image
                ? `${bg.color ?? "transparent"} url(${bg.image}) center/${bg.imageFit ?? "cover"} no-repeat`
                : bg?.color ?? t.colors?.background ?? "#ffffff",
    };

    return (
        <div
            ref={ref}
            className={cn("fs-slide", className)}
            style={{
                width: width ? `${width}px` : "100%",
                height: width ? `${width / ratio}px` : `${slideHeightPx}px`,
                position: "relative",
                overflow: "hidden",
                color: t.colors?.text,
                ...backgroundStyle,
                ...style,
            }}
            data-fancy-slides-slide={slide.id}
            onClick={(e) => {
                if (e.target === e.currentTarget && onElementSelect) onElementSelect(null);
            }}
        >
            {orderedElements(slide.elements).map((element) => (
                <SlideElementHost
                    key={element.id}
                    element={element}
                    theme={t}
                    slideWidthPx={slideWidthPx}
                    slideHeightPx={slideHeightPx}
                    editing={editing}
                    selected={selectedElementId === element.id}
                    onContentChange={onElementContentChange}
                    onSelect={onElementSelect}
                    renderElement={renderElement}
                />
            ))}
        </div>
    );
}

interface SlideElementHostProps {
    element: SlideElement;
    theme: Theme;
    slideWidthPx: number;
    slideHeightPx: number;
    editing: boolean;
    selected: boolean;
    onContentChange?: (elementId: string, content: string) => void;
    onSelect?: (elementId: string | null) => void;
    renderElement?: (element: SlideElement, slideWidthPx: number) => ReactNode | undefined;
}

function SlideElementHost({
    element,
    theme,
    slideWidthPx,
    slideHeightPx,
    editing,
    selected,
    onContentChange,
    onSelect,
    renderElement,
}: SlideElementHostProps) {
    if (element.hidden) return null;

    const left = element.x * slideWidthPx;
    const top = element.y * slideHeightPx;
    const width = element.w * slideWidthPx;
    const height = element.h * slideHeightPx;

    const box: CSSProperties = {
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        transformOrigin: "center center",
        zIndex: element.z ?? "auto",
        outline: selected ? "2px solid #8b5cf6" : undefined,
        outlineOffset: selected ? 2 : undefined,
        cursor: editing ? "pointer" : "default",
    };

    const inner = renderInner({ element, theme, slideWidthPx, editing, onContentChange }) ?? renderElement?.(element, slideWidthPx);

    return (
        <div
            style={box}
            data-fancy-slides-element={element.id}
            data-fancy-slides-element-type={element.type}
            onClick={(e) => {
                if (!onSelect) return;
                e.stopPropagation();
                onSelect(element.id);
            }}
        >
            {inner}
        </div>
    );
}

interface RenderInnerArgs {
    element: SlideElement;
    theme: Theme;
    slideWidthPx: number;
    editing: boolean;
    onContentChange?: (elementId: string, content: string) => void;
}

function renderInner({ element, theme, slideWidthPx, editing, onContentChange }: RenderInnerArgs): ReactNode | undefined {
    switch (element.type) {
        case "text":
            return (
                <TextElementRenderer
                    element={element}
                    theme={theme}
                    slideWidthPx={slideWidthPx}
                    editing={editing}
                    onContentChange={onContentChange ? (c) => onContentChange(element.id, c) : undefined}
                />
            );
        case "image":
            return <ImageElementRenderer element={element} />;
        case "shape":
            return <ShapeElementRenderer element={element} theme={theme} slideWidthPx={slideWidthPx} />;
        case "chart":
        case "code":
        case "table":
        case "embed":
            // These render via consumer-provided `renderElement` so we don't
            // pull fancy-echarts / fancy-code / etc. into the package's static
            // graph. The package ships with a default registry that hosts can
            // import from `@particle-academy/fancy-slides/registry` (added in
            // v0.2). For now the host must pass `renderElement`.
            return undefined;
        default:
            return null;
    }
}

function orderedElements(elements: SlideElement[]): SlideElement[] {
    // Elements without a `z` keep their array order; explicit z overrides win.
    return [...elements].sort((a, b) => {
        const az = a.z ?? -1;
        const bz = b.z ?? -1;
        if (az === bz) return 0;
        return az < bz ? -1 : 1;
    });
}
