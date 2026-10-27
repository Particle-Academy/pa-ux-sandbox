import type { CSSProperties, ElementType, ReactNode } from "react";
import type { FeatureTheme } from "./types";

/**
 * Scopes one Feature's identity to everything inside it.
 *
 * The tokens arrive from `App\Support\FeatureSites` and land as four CSS
 * custom properties on this ONE wrapper — the same way the package pages set
 * `--accent` — and nowhere else. `resources/css/showcase/features.css` turns
 * them into `--feature-accent`, `--feature-surface` and `--feature-font`,
 * swapping the light and dark pair under `.dark` and `[data-theme="dark"]`, so
 * no component below ever reads a colour from props or writes a style of its
 * own.
 */
export function FeatureIdentity({
    slug,
    theme,
    as: As = "div",
    className,
    children,
}: {
    slug: string;
    theme: FeatureTheme;
    as?: ElementType;
    className?: string;
    children: ReactNode;
}) {
    const vars = {
        "--feature-accent-light": theme.accent,
        "--feature-accent-dark": theme.accentDark,
        "--feature-surface-light": theme.surface,
        "--feature-surface-dark": theme.surfaceDark,
    } as CSSProperties;

    return (
        <As
            className={["feature-site", className].filter(Boolean).join(" ")}
            data-feature={slug}
            data-feature-font={theme.font}
            style={vars}
        >
            {children}
        </As>
    );
}
