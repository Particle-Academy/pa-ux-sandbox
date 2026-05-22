import type { CSSProperties } from "react";
import type { TextElement, Theme } from "../../../types";
import { resolveTheme } from "../../../theme/theme-utils";

export interface TextElementRendererProps {
    element: TextElement;
    theme?: Theme;
    /** Rendered slide width in px (for font-size scaling). */
    slideWidthPx: number;
    /** Edit mode — when true, the textarea is focusable. */
    editing?: boolean;
    /** Called when the user edits the content (only when `editing`). */
    onContentChange?: (content: string) => void;
}

export function TextElementRenderer({
    element,
    theme,
    slideWidthPx,
    editing = false,
    onContentChange,
}: TextElementRendererProps) {
    const t = resolveTheme(theme);
    const style = element.style ?? {};
    const designWidth = t.slideWidth ?? 1920;
    const scale = slideWidthPx / designWidth;

    const css: CSSProperties = {
        fontFamily: style.fontFamily ?? t.fonts?.body,
        fontSize: `${(style.fontSize ?? 28) * scale}px`,
        fontWeight: weight(style.weight) ?? 400,
        fontStyle: style.italic ? "italic" : "normal",
        textDecoration: style.underline ? "underline" : "none",
        color: style.color ?? t.colors?.text,
        textAlign: style.align ?? "left",
        lineHeight: style.lineHeight ?? 1.4,
        display: "flex",
        flexDirection: "column",
        justifyContent:
            style.verticalAlign === "middle" ? "center" : style.verticalAlign === "bottom" ? "flex-end" : "flex-start",
        width: "100%",
        height: "100%",
        padding: 0,
        margin: 0,
        outline: "none",
        background: "transparent",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "hidden",
    };

    if (editing) {
        return (
            <textarea
                value={element.content}
                onChange={(e) => onContentChange?.(e.target.value)}
                style={{ ...css, resize: "none", border: "none" }}
            />
        );
    }

    // Read-only mode: render markdown / plain. Format-aware rendering can plug
    // in via consumer's ContentRenderer down the road; for v0.1 we render the
    // raw content with the right typography. Markdown / HTML rendering will
    // come in v0.2 once we wire up the ContentRenderer integration.
    if (element.format === "html") {
        return <div style={css} dangerouslySetInnerHTML={{ __html: element.content }} />;
    }
    return <div style={css}>{element.content}</div>;
}

function weight(w: "normal" | "medium" | "semibold" | "bold" | number | undefined): number | undefined {
    if (typeof w === "number") return w;
    if (w === "normal") return 400;
    if (w === "medium") return 500;
    if (w === "semibold") return 600;
    if (w === "bold") return 700;
    return undefined;
}
